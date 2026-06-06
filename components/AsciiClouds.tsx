"use client";

import { useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  cellSize: 8,
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
// Pre-render every (char × opacity-step) combination once at startup.
// During animation we call drawImage() instead of fillText() + fillStyle=,
// eliminating per-cell GPU state flushes entirely.
const ALPHA_STEPS = 16; // quantise edgeAlpha to 16 levels — visually identical
function buildGlyphAtlas(cs: number): HTMLCanvasElement[][] {
  return CHARS.split("").map((ch) => {
    return Array.from({ length: ALPHA_STEPS }, (_, i) => {
      const a = (i + 1) / ALPHA_STEPS;
      const gc = document.createElement("canvas");
      gc.width = cs;
      gc.height = cs;
      const gx = gc.getContext("2d")!;
      gx.font = `bold ${cs}px monospace`;
      gx.textBaseline = "top";
      gx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      gx.fillText(ch, 0, 0);
      return gc;
    });
  });
}

export default function AsciiClouds({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cs = CONFIG.cellSize;

    // Build glyph atlas once — tiny canvases, drawn once, reused every frame
    const glyphAtlas = buildGlyphAtlas(cs);

    // ── Pre-allocated offscreen canvases ──────────────────────────────────────
    // willReadFrequently: true → browser keeps this in CPU RAM, getImageData
    // becomes a direct memcpy instead of a GPU→CPU readback.
    const offSample = document.createElement("canvas");
    const offSampleCtx = offSample.getContext("2d", { willReadFrequently: true })!;

    // ASCII layer — white glyphs on transparent, masked later
    const offAscii = document.createElement("canvas");
    const offAsciiCtx = offAscii.getContext("2d")!;

    // Displacement mask — pre-allocated, only resized on grid change
    const maskCell = document.createElement("canvas");
    const maskCellCtx = maskCell.getContext("2d", { willReadFrequently: true })!;
    let maskImageData: ImageData | null = null;
    let maskCols = 0;
    let maskRows = 0;

    const img = new Image();
    img.src = "/assets/clouds.png";

    const MAX_DISP = 2;

    // Track last rendered size to avoid redundant main-canvas resizes
    let lastW = 0;
    let lastH = 0;

    let frame = 0;

    function render(t: number) {
      const container = canvas!.parentElement;
      if (!container) return;
      const W = container.clientWidth;
      const H = container.clientHeight;
      if (W === 0 || H === 0) return;
      if (!img.complete || img.naturalWidth === 0) return;

      const cols = Math.floor(W / cs);
      const rows = Math.floor(H / cs);

      // ── 1. Sample cloud image at grid resolution ──────────────────────────
      // Assign .width to clear+reset context state (same as original)
      offSample.width = cols;
      offSample.height = rows;
      offSampleCtx.drawImage(img, 0, 0, cols, rows);
      // Fast because willReadFrequently keeps the buffer CPU-side
      const px = offSampleCtx.getImageData(0, 0, cols, rows).data;

      // ── 2. Draw ASCII glyph layer ─────────────────────────────────────────
      // Assign .width to clear + reset composite op (load-bearing, same as original)
      offAscii.width = W;
      offAscii.height = H;
      // No fillStyle or font needed — we drawImage from the atlas

      const s = CONFIG.speed * 0.018;
      const wAmp = CONFIG.waveDepth * 0.3;
      const dAmp = CONFIG.displacement * MAX_DISP;
      const { threshold, ceiling } = CONFIG;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ni = ((row % NOISE_H) * NOISE_W + (col % NOISE_W)) * 5;
          const bPhase = NOISE[ni];
          const bSpeed = NOISE[ni + 1];

          const idx = (row * cols + col) * 4;
          const alpha = px[idx + 3] / 255;

          if (alpha < threshold) continue;

          const wave =
            Math.sin(t * s * bSpeed * 1.3 + bPhase) * wAmp +
            Math.sin(t * s * bSpeed * 0.6 + bPhase * 1.9) * wAmp * 0.4;

          const base = (alpha - threshold) / (ceiling - threshold);
          const modulated = Math.min(1, Math.max(0.05, base + wave));

          const charIdx = Math.floor(modulated * (CHARS.length - 1));

          // Quantise edgeAlpha to ALPHA_STEPS levels → index into atlas
          // Matches original formula: alpha / 0.05 (clamped) when threshold=0
          const edgeAlpha = Math.min(1, alpha / (threshold * 0.5 + 0.05));
          const alphaIdx = Math.min(ALPHA_STEPS - 1, Math.floor(edgeAlpha * ALPHA_STEPS));

          // drawImage from pre-rendered atlas — no fillStyle change, no fillText
          offAsciiCtx.drawImage(glyphAtlas[charIdx][alphaIdx], col * cs, row * cs);
        }
      }

      // ── 3. Build displaced cloud mask — reuse pre-allocated canvas ─────────
      if (cols !== maskCols || rows !== maskRows) {
        maskCell.width = cols;
        maskCell.height = rows;
        maskImageData = maskCellCtx.createImageData(cols, rows);
        maskCols = cols;
        maskRows = rows;
      }
      const maskPx = maskImageData!.data;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ni = ((row % NOISE_H) * NOISE_W + (col % NOISE_W)) * 5;
          const dPhase = NOISE[ni + 2];
          const dDir   = NOISE[ni + 3];
          const dSpeed = NOISE[ni + 4];

          const disp = Math.sin(t * s * dSpeed + dPhase) * dAmp * dDir;
          const srcRow = Math.min(rows - 1, Math.max(0, Math.round(row + disp)));

          const srcIdx = (srcRow * cols + col) * 4;
          const dstIdx = (row * cols + col) * 4;
          maskPx[dstIdx]     = px[srcIdx];
          maskPx[dstIdx + 1] = px[srcIdx + 1];
          maskPx[dstIdx + 2] = px[srcIdx + 2];
          maskPx[dstIdx + 3] = px[srcIdx + 3];
        }
      }
      maskCellCtx.putImageData(maskImageData!, 0, 0);

      // ── 4. Composite: displaced mask as destination-in ────────────────────
      offAsciiCtx.globalCompositeOperation = "destination-in";
      offAsciiCtx.drawImage(maskCell, 0, 0, W, H);
      offAsciiCtx.globalCompositeOperation = "source-over";

      // ── 5. Paint onto main canvas ─────────────────────────────────────────
      // Only resize the main canvas when dimensions change — avoids a full
      // GPU surface reallocation on every frame (was canvas.width=W every frame)
      if (W !== lastW || H !== lastH) {
        canvas!.width = W;
        canvas!.height = H;
        lastW = W;
        lastH = H;
      }
      const ctx = canvas!.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(offAscii, 0, 0);
    }

    // ── FPS cap via setTimeout → rAF ─────────────────────────────────────────
    // Why not just skip frames inside rAF?
    // Skipping in rAF means work still fires in a burst at vsync — you get a
    // stutter spike every N frames. setTimeout fires at the right cadence,
    // then rAF aligns the actual paint to the next vsync after that.
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