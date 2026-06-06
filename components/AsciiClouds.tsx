"use client";

import { useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  cellSize: 8,   // visual size of one character cell in CSS pixels
  threshold: 0,
  ceiling: 1,
  speed: 5,
  waveDepth: 0.3,
  displacement: 0.6,
  fps: 5,
};
// ─────────────────────────────────────────────────────────────────────────────

const CHARS = ".:+#@G";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE_W = 300;
const NOISE_H = 150;
const rng = mulberry32(0xc0ffee42);
const NOISE = new Float32Array(NOISE_W * NOISE_H * 5);
for (let i = 0; i < NOISE_W * NOISE_H; i++) {
  NOISE[i * 5 + 0] = rng() * Math.PI * 2;
  NOISE[i * 5 + 1] = 0.6 + rng() * 0.8;
  NOISE[i * 5 + 2] = rng() * Math.PI * 2;
  NOISE[i * 5 + 3] = rng() > 0.5 ? 1 : -1;
  NOISE[i * 5 + 4] = 0.4 + rng() * 0.6;
}

// ─── Glyph atlas ─────────────────────────────────────────────────────────────
// One atlas per (dpr) value. Each tile is cs*dpr physical pixels wide/tall.
// The font is drawn at cs*dpr px with no ctx.scale() — that way the browser's
// own text rasterizer works at the native physical resolution and we get its
// full subpixel hinting for free. A 1:1 drawImage() blit then places it in
// offAscii with zero upscaling anywhere in the pipeline.
const ALPHA_STEPS = 16;
function buildGlyphAtlas(cs: number, dpr: number): HTMLCanvasElement[][] {
  const tileSize = Math.ceil(cs * dpr); // physical pixels per cell
  return CHARS.split("").map((ch) => {
    return Array.from({ length: ALPHA_STEPS }, (_, i) => {
      const a = (i + 1) / ALPHA_STEPS;
      const gc = document.createElement("canvas");
      gc.width  = tileSize;
      gc.height = tileSize;
      const gx = gc.getContext("2d")!;
      // Draw the font at physical pixel size directly — no ctx.scale needed.
      // This is the sharpest possible text: the rasterizer sees exactly the
      // pixel grid it will be painted onto.
      gx.font = `bold ${tileSize}px monospace`;
      gx.textBaseline = "top";
      gx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      gx.fillText(ch, 0, 0);
      return gc;
    });
  });
}

export default function AsciiClouds({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cs = CONFIG.cellSize; // CSS-pixel cell size (logical design constant)

    // ── Effective pixel ratio — device DPR × visual viewport scale ───────────
    // There are two independent zoom mechanisms:
    //   1. Ctrl+/-  / browser zoom  → changes window.devicePixelRatio
    //   2. Touchpad pinch zoom      → changes window.visualViewport.scale
    //      (the page is scaled by the compositor; devicePixelRatio stays fixed)
    // We multiply both together so every zoom path is covered.
    function getEffectiveDpr(): number {
      const vvScale = window.visualViewport?.scale ?? 1;
      return (window.devicePixelRatio || 1) * vvScale;
    }
    let cachedDpr  = getEffectiveDpr();
    let glyphAtlas = buildGlyphAtlas(cs, cachedDpr);

    // ── Pre-allocated offscreen canvases ──────────────────────────────────────
    const offSample    = document.createElement("canvas");
    const offSampleCtx = offSample.getContext("2d", { willReadFrequently: true })!;

    const offAscii    = document.createElement("canvas");
    const offAsciiCtx = offAscii.getContext("2d")!;

    const maskCell    = document.createElement("canvas");
    const maskCellCtx = maskCell.getContext("2d", { willReadFrequently: true })!;
    let maskImageData: ImageData | null = null;
    let maskCols = 0;
    let maskRows = 0;

    const img = new Image();
    img.src = "/assets/clouds.png";

    const MAX_DISP = 2;

    let lastPW  = 0;
    let lastPH  = 0;
    let lastDpr = 0;

    let frame = 0;

    function render(t: number) {
      if (!img.complete || img.naturalWidth === 0) return;

      // ── Measure the canvas's true rendered size ───────────────────────────
      // getBoundingClientRect() returns CSS pixels that already account for
      // any CSS transforms, flex/grid layout, etc. — always accurate.
      const rect = canvas!.getBoundingClientRect();
      const W = rect.width;   // CSS pixels (may be fractional)
      const H = rect.height;
      if (W === 0 || H === 0) return;

      // ── Effective dpr — read every frame, covers both zoom mechanisms ────────
      const dpr = getEffectiveDpr();
      if (Math.abs(dpr - cachedDpr) > 0.001) {
        cachedDpr  = dpr;
        glyphAtlas = buildGlyphAtlas(cs, dpr);
      }

      // Physical canvas dimensions
      const PW = Math.round(W * dpr);
      const PH = Math.round(H * dpr);

      // Physical cell stride — the atlas tile size exactly
      const phys = Math.ceil(cs * dpr);

      // Grid dimensions (still in CSS-pixel terms — determines how many cells)
      const cols = Math.floor(W / cs);
      const rows = Math.floor(H / cs);

      // ── 1. Sample cloud image at grid resolution ──────────────────────────
      offSample.width  = cols;
      offSample.height = rows;
      offSampleCtx.drawImage(img, 0, 0, cols, rows);
      const px = offSampleCtx.getImageData(0, 0, cols, rows).data;

      // ── 2. Draw ASCII glyph layer at physical resolution ──────────────────
      // offAscii is exactly PW×PH physical pixels.
      // Each atlas tile (phys×phys) is blitted 1:1 — zero scaling, zero blur.
      offAscii.width  = PW;
      offAscii.height = PH;

      const s    = CONFIG.speed * 0.018;
      const wAmp = CONFIG.waveDepth * 0.3;
      const dAmp = CONFIG.displacement * MAX_DISP;
      const { threshold, ceiling } = CONFIG;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ni = ((row % NOISE_H) * NOISE_W + (col % NOISE_W)) * 5;
          const bPhase = NOISE[ni];
          const bSpeed = NOISE[ni + 1];

          const idx   = (row * cols + col) * 4;
          const alpha = px[idx + 3] / 255;

          if (alpha < threshold) continue;

          const wave =
            Math.sin(t * s * bSpeed * 1.3 + bPhase) * wAmp +
            Math.sin(t * s * bSpeed * 0.6 + bPhase * 1.9) * wAmp * 0.4;

          const base      = (alpha - threshold) / (ceiling - threshold);
          const modulated = Math.min(1, Math.max(0.05, base + wave));
          const charIdx   = Math.floor(modulated * (CHARS.length - 1));

          const edgeAlpha = Math.min(1, alpha / (threshold * 0.5 + 0.05));
          const alphaIdx  = Math.min(ALPHA_STEPS - 1, Math.floor(edgeAlpha * ALPHA_STEPS));

          offAsciiCtx.drawImage(glyphAtlas[charIdx][alphaIdx], col * phys, row * phys);
        }
      }

      // ── 3. Build displaced cloud mask ─────────────────────────────────────
      if (cols !== maskCols || rows !== maskRows) {
        maskCell.width  = cols;
        maskCell.height = rows;
        maskImageData   = maskCellCtx.createImageData(cols, rows);
        maskCols = cols;
        maskRows = rows;
      }
      const maskPx = maskImageData!.data;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ni     = ((row % NOISE_H) * NOISE_W + (col % NOISE_W)) * 5;
          const dPhase = NOISE[ni + 2];
          const dDir   = NOISE[ni + 3];
          const dSpeed = NOISE[ni + 4];

          const disp   = Math.sin(t * s * dSpeed + dPhase) * dAmp * dDir;
          const srcRow = Math.min(rows - 1, Math.max(0, Math.round(row + disp)));

          const srcIdx = (srcRow * cols + col) * 4;
          const dstIdx = (row   * cols + col) * 4;
          maskPx[dstIdx]     = px[srcIdx];
          maskPx[dstIdx + 1] = px[srcIdx + 1];
          maskPx[dstIdx + 2] = px[srcIdx + 2];
          maskPx[dstIdx + 3] = px[srcIdx + 3];
        }
      }
      maskCellCtx.putImageData(maskImageData!, 0, 0);

      // ── 4. Composite: displaced mask as destination-in ────────────────────
      offAsciiCtx.globalCompositeOperation = "destination-in";
      offAsciiCtx.drawImage(maskCell, 0, 0, PW, PH);
      offAsciiCtx.globalCompositeOperation = "source-over";

      // ── 5. Paint onto main canvas ─────────────────────────────────────────
      // Resize the backing buffer only when the physical size actually changes.
      if (PW !== lastPW || PH !== lastPH || dpr !== lastDpr) {
        canvas!.width  = PW;
        canvas!.height = PH;
        lastPW  = PW;
        lastPH  = PH;
        lastDpr = dpr;
      }
      const ctx = canvas!.getContext("2d")!;
      // imageSmoothingEnabled stays TRUE (default) on the final blit.
      // The buffer is physical-pixel sized; the browser composites it back to
      // CSS size using bilinear filtering — which gives smooth, anti-aliased
      // characters. Setting it to false would make nearest-neighbour = blocky.
      ctx.clearRect(0, 0, PW, PH);
      ctx.drawImage(offAscii, 0, 0);
    }

    // ── FPS cap via setTimeout → rAF ─────────────────────────────────────────
    const interval = 1000 / CONFIG.fps;

    function scheduleNext() {
      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(() => {
          render(frame++);
          scheduleNext();
        });
      }, interval);
    }

    if (img.complete && img.naturalWidth > 0) {
      scheduleNext();
    } else {
      img.onload = scheduleNext;
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}