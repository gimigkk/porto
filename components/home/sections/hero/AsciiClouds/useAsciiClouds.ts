/**
 * useAsciiClouds.ts
 * 
 * React hook that manages the lifecycle of the ASCII cloud simulation.
 * It initializes the renderer, binds DOM event listeners for pointer interaction,
 * and runs the main requestAnimationFrame loop that drives the physics and rendering.
 * 
 * Supports pause/resume via global 'ascii-pause' / 'ascii-resume' events so the
 * mobile navbar can temporarily free the main thread for smooth CSS transitions.
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
  /** Fired once the first canvas frame is fully drawn */
  onFirstFrameRendered?: () => void;
  progressRef?: React.MutableRefObject<number>;
}

export function useAsciiClouds(options: UseAsciiCloudsOptions = {}) {
  const { isReady = true, preloadedAssets = null, onIntroComplete, onFirstFrameRendered, progressRef } = options;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const introCompleteRef = useRef(false);
  const firstFrameRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    // Don't start until preloader signals ready
    if (!isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new AsciiRenderer(canvas);
    
    let simTimeMs = 0;
    let lastRealTime = performance.now();
    let lastPhysicsTime = 0;
    let lastRenderTime = 0;

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

    // Pause sources — unified flag check
    const pauseFlags = { ascii: false, visible: true, tab: false };

    function checkShouldPause() {
      const shouldPause = !pauseFlags.visible || pauseFlags.tab || pauseFlags.ascii;
      if (shouldPause && !pausedRef.current) {
        pausedRef.current = true;
        cancelAnimationFrame(rafRef.current);
      } else if (!shouldPause && pausedRef.current) {
        pausedRef.current = false;
        lastRealTime = performance.now();
        rafRef.current = requestAnimationFrame(loop);
      }
    }

    const handlePause = () => { pauseFlags.ascii = true; checkShouldPause(); };
    const handleResume = () => { pauseFlags.ascii = false; checkShouldPause(); };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerLeave, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("ascii-pause", handlePause);
    let heroHeight = window.innerHeight; // fallback
    const heroEl = document.getElementById("home");
    if (heroEl) heroHeight = heroEl.getBoundingClientRect().height;

    const onScrollVisibility = () => {
      const wasVisible = pauseFlags.visible;
      // If progressRef is provided, pause when progress === 1 (fully docked/covered)
      // Otherwise fallback to the old heroHeight check
      if (progressRef) {
        pauseFlags.visible = progressRef.current < 1;
      } else {
        const scrollY = window.scrollY || 0;
        pauseFlags.visible = scrollY < heroHeight + 100;
      }
      if (wasVisible !== pauseFlags.visible) checkShouldPause();
    };
    window.addEventListener("scroll", onScrollVisibility, { passive: true });
    onScrollVisibility(); // set initial state

    // Pause when tab hidden (saves battery on background tabs)
    const onVisibility = () => { pauseFlags.tab = document.hidden; checkShouldPause(); };
    document.addEventListener("visibilitychange", onVisibility);

    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);

      let realDt = now - lastRealTime;
      if (realDt < 0) realDt = 0;
      if (realDt > 100) realDt = 100;
      lastRealTime = now;

      const W = renderer.currentW;
      const H = renderer.currentH;
      if (W === 0 || H === 0) return;

      let speedScale = 1.0;
      if (progressRef) {
        speedScale = Math.max(0, Math.pow(1 - progressRef.current, 3));
      }
      if (speedScale <= 0.001) return;

      simTimeMs += realDt * speedScale;
      const t = simTimeMs / 1000;

      const isIntro = t < CONFIG.introDuration;

      // Fire intro complete callback very early (at 0.5s) for heavy overlap
      const overlapStart = 0.5;
      if (t >= overlapStart && !introCompleteRef.current) {
        introCompleteRef.current = true;
        onIntroComplete?.();
      }

      const activeCellSize = W < 768 ? 5 : CONFIG.cellSize;
      let currentCellSize = activeCellSize;
      let introOffsetNorm = 0;
      if (isIntro) {
        const progress = t / CONFIG.introDuration;
        const warped = Math.pow(progress, 0.35);
        const ease = warped === 0 ? 0 : warped === 1 ? 1 : warped < 0.5 
          ? Math.pow(2, 20 * warped - 10) / 2 
          : (2 - Math.pow(2, -20 * warped + 10)) / 2;
        const calculatedSize = CONFIG.introStartSize * Math.pow(activeCellSize / CONFIG.introStartSize, ease);
        currentCellSize = Math.min(200, calculatedSize);
        introOffsetNorm = CONFIG.introSlideY * (1 - ease);
      }

      const cols = Math.max(1, Math.floor(W / currentCellSize));
      const rows = Math.max(1, Math.floor(H / currentCellSize));

      // Physics coupled to simTimeMs. Still ticks at 30Hz of *simulated* time.
      const physicsInterval = 1000 / 30;
      if (simTimeMs - lastPhysicsTime >= physicsInterval) {
        const physDt = Math.min((simTimeMs - lastPhysicsTime) / 1000, 0.05);
        lastPhysicsTime = simTimeMs - ((simTimeMs - lastPhysicsTime) % physicsInterval);

        updateDisruptions(state, mouse, physDt, cols, rows, W, H);
        updateBlobs(state, mouse, physDt, t, cols, isIntro, W, H, renderer.imgData, renderer.imgW, renderer.imgH);
        if (!isIntro) {
          updateGusts(state, t, cols);
        }
      }

      // Render FPS: Firefox 30, desktop 60, mobile intro lower
      const isFirefox = navigator.userAgent.includes("Firefox");
      const isLowEnd = (navigator.hardwareConcurrency || 4) <= 4;
      let targetFps = isFirefox || isLowEnd ? 30 : CONFIG.fps;
      if (isIntro && W < 768) {
        targetFps = 30;
      }

      const renderInterval = 1000 / targetFps;
      if (simTimeMs - lastRenderTime >= renderInterval) {
        lastRenderTime = simTimeMs - ((simTimeMs - lastRenderTime) % renderInterval);
        renderer.render(state, simTimeMs, 0, isIntro, introOffsetNorm, cols, rows);

        if (!firstFrameRef.current) {
          firstFrameRef.current = true;
          onFirstFrameRendered?.();
        }
      }
    }

    function startLoop() {
      lastRealTime = performance.now();
      simTimeMs = 0;
      // Offset so physics + render fire on first frame
      lastPhysicsTime = -(1000 / 30);
      lastRenderTime = -(1000 / 60);
      rafRef.current = requestAnimationFrame(loop);
    }

    // Use preloaded assets if available, otherwise fall back to loading
    if (preloadedAssets) {
      renderer.setImageData(
        preloadedAssets.cloudImageData,
        preloadedAssets.cloudImageWidth,
        preloadedAssets.cloudImageHeight
      );
      // Use pre-built glyph atlas to avoid blocking first render frame
      if (preloadedAssets.glyphAtlas) {
        renderer.setGlyphAtlas(preloadedAssets.glyphAtlas, preloadedAssets.glyphTileSize);
      }
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
      window.removeEventListener("ascii-pause", handlePause);
      window.removeEventListener("ascii-resume", handleResume);
      window.removeEventListener("scroll", onScrollVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isReady, preloadedAssets]);

  return canvasRef;
}