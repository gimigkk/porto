/**
 * useAsciiClouds.ts
 * 
 * React hook that manages the lifecycle of the ASCII cloud simulation.
 * It initializes the renderer, binds DOM event listeners for pointer interaction,
 * and runs the main requestAnimationFrame loop that drives the physics and rendering.
 */
import { useEffect, useRef } from "react";
import { CONFIG, CloudState, MouseState } from "./CloudAsciiCore";
import { updateGusts, updateBlobs, updateDisruptions } from "./CloudAsciiPhysics";
import { AsciiRenderer } from "./CloudAsciiRenderer";
import type { PreloadedAssets } from "@/hooks/usePreloader";

interface UseAsciiCloudsOptions {
  /** Signal: start animation only when true */
  isReady?: boolean;
  /** Pre-extracted cloud image data from the preloader */
  preloadedAssets?: PreloadedAssets | null;
  /** Fired once when the intro zoom/slide animation completes */
  onIntroComplete?: () => void;
}

export function useAsciiClouds(options: UseAsciiCloudsOptions = {}) {
  const { isReady = true, preloadedAssets = null, onIntroComplete } = options;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const introCompleteRef = useRef(false);

  useEffect(() => {
    // Don't start until preloader signals ready
    if (!isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new AsciiRenderer(canvas);
    
    let startTime = performance.now();
    let lastPhysicsTime = performance.now();
    let lastRenderTime = performance.now();

    // Detect mobile for FPS capping
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const mouse: MouseState = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, active: false, hasMoved: false };
    const state: CloudState = {
      gusts: [],
      blobs: [],
      disruptions: [],
      lastSpawnTime: -CONFIG.spawnInterval,
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!mouse.active) {
        mouse.px = x;
        mouse.py = y;
      }
      mouse.x = x;
      mouse.y = y;
      mouse.active = true;
      mouse.hasMoved = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.hasMoved = false;
    };

    const handleScroll = () => {
      mouse.active = false;
      mouse.hasMoved = false;
      mouse.vx = 0;
      mouse.vy = 0;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerMove);
    window.addEventListener("pointerup", handlePointerLeave);
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });

    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);

      const t = (now - startTime) / 1000;
      let dt = (now - lastPhysicsTime) / 1000;
      if (dt < 0) dt = 0;
      if (dt > 0.1) dt = 0.1;
      lastPhysicsTime = now;

      const W = renderer.currentW;
      const H = renderer.currentH;
      if (W === 0 || H === 0) return;

      const isIntro = t < CONFIG.introDuration;

      // Fire intro complete callback very early (at 0.5s) for heavy overlap
      const overlapStart = 0.5;
      if (t >= overlapStart && !introCompleteRef.current) {
        introCompleteRef.current = true;
        onIntroComplete?.();
      }

      let currentCellSize = CONFIG.cellSize;
      let introOffsetNorm = 0;
      if (isIntro) {
        const progress = t / CONFIG.introDuration;
        const warped = Math.pow(progress, 0.35);
        const ease = warped === 0 ? 0 : warped === 1 ? 1 : warped < 0.5 
          ? Math.pow(2, 20 * warped - 10) / 2 
          : (2 - Math.pow(2, -20 * warped + 10)) / 2;
        const calculatedSize = CONFIG.introStartSize * Math.pow(CONFIG.cellSize / CONFIG.introStartSize, ease);
        currentCellSize = Math.min(200, calculatedSize);
        introOffsetNorm = CONFIG.introSlideY * (1 - ease);
      }

      const cols = Math.max(1, Math.floor(W / currentCellSize));
      const rows = Math.max(1, Math.floor(H / currentCellSize));

      updateDisruptions(state, mouse, dt, cols, rows, W, H);
      updateBlobs(state, mouse, dt, t, cols, isIntro, W, H, renderer.imgData, renderer.imgW, renderer.imgH);
      if (!isIntro) {
        updateGusts(state, t, cols);
      }

      // FPS cap: 30fps for mobile intro, 60fps for desktop, normal 60fps post-intro
      const targetFps = (isIntro && isMobile) ? 30 : CONFIG.fps;
      const interval = 1000 / targetFps;
      if (isIntro || (now - lastRenderTime >= interval)) {
        if (!isIntro) {
          lastRenderTime = now - ((now - lastRenderTime) % interval);
        } else {
          // Mobile intro: enforce interval. Desktop intro: uncapped (original behavior)
          if (isMobile) {
            if (now - lastRenderTime < interval) return;
            lastRenderTime = now - ((now - lastRenderTime) % interval);
          } else {
            lastRenderTime = now;
          }
        }
        renderer.render(state, now, startTime, isIntro, introOffsetNorm, cols, rows);
      }
    }

    function startLoop() {
      startTime = performance.now();
      lastPhysicsTime = startTime;
      lastRenderTime = startTime;
      rafRef.current = requestAnimationFrame(loop);
    }

    // Use preloaded assets if available, otherwise fall back to loading
    if (preloadedAssets) {
      renderer.setImageData(
        preloadedAssets.cloudImageData,
        preloadedAssets.cloudImageWidth,
        preloadedAssets.cloudImageHeight
      );
      startLoop();
    } else {
      // Fallback: load image ourselves
      const img = new Image();
      img.src = "/assets/clouds.png";
      img.onload = () => {
        const tempCvs = document.createElement("canvas");
        tempCvs.width = img.naturalWidth;
        tempCvs.height = img.naturalHeight;
        const tCtx = tempCvs.getContext("2d", { willReadFrequently: true })!;
        tCtx.drawImage(img, 0, 0);
        const data = tCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
        renderer.setImageData(data, img.naturalWidth, img.naturalHeight);
        startLoop();
      };
    }

    return () => {
      renderer.destroy();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerLeave);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [isReady, preloadedAssets]);

  return canvasRef;
}