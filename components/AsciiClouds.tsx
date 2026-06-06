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
  fps: 10,
  // ── Wind gust ──────────────────────────────────────────────────────────────
  windSpeed: 24,      // cols per second the gust travels left→right
  windWidth: 0.20,    // gust half-width as fraction of total columns
  windBoost: 0.3,     // peak brightness boost added to modulated (0–1)
  windWobble: 0.22,   // vertical sine wobble on the gust edge (fraction of rows)
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
const ALPHA_STEPS = 16;
function buildGlyphAtlas(cs: number, dpr: number): HTMLCanvasElement[][] {
  const tileSize = Math.ceil(cs * dpr);
  return CHARS.split("").map((ch) => {
    return Array.from({ length: ALPHA_STEPS }, (_, i) => {
      const a = (i + 1) / ALPHA_STEPS;
      const gc = document.createElement("canvas");
      gc.width  = tileSize;
      gc.height = tileSize;
      const gx = gc.getContext("2d")!;
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

    const cs = CONFIG.cellSize;

    function getEffectiveDpr(): number {
      const vvScale = window.visualViewport?.scale ?? 1;
      return (window.devicePixelRatio || 1) * vvScale;
    }
    let cachedDpr  = getEffectiveDpr();
    let glyphAtlas = buildGlyphAtlas(cs, cachedDpr);

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

    // ── Time in seconds (fps-independent) ────────────────────────────────────
    // t is now real elapsed seconds from performance.now(), not a frame counter.
    // This makes windSpeed (cols/sec), speed, etc. behave consistently regardless
    // of fps setting or frame drops.
    const startTime = performance.now();
    let frame = 0; // still used for the noise phase offsets (same as before)

    function render() {
      if (!img.complete || img.naturalWidth === 0) return;

      const rect = canvas!.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      if (W === 0 || H === 0) return;

      // Real elapsed seconds — drives wind gust and all other animations
      const t = (performance.now() - startTime) / 1000;

      const dpr = getEffectiveDpr();
      if (Math.abs(dpr - cachedDpr) > 0.001) {
        cachedDpr  = dpr;
        glyphAtlas = buildGlyphAtlas(cs, dpr);
      }

      const PW   = Math.round(W * dpr);
      const PH   = Math.round(H * dpr);
      const phys = Math.ceil(cs * dpr);

      const cols = Math.floor(W / cs);
      const rows = Math.floor(H / cs);

      // ── 1. Sample cloud image at grid resolution ──────────────────────────
      offSample.width  = cols;
      offSample.height = rows;
      offSampleCtx.drawImage(img, 0, 0, cols, rows);
      const px = offSampleCtx.getImageData(0, 0, cols, rows).data;

      // ── 2. Draw ASCII glyph layer ─────────────────────────────────────────
      offAscii.width  = PW;
      offAscii.height = PH;

      const s    = CONFIG.speed * 0.018;
      const wAmp = CONFIG.waveDepth * 0.3;
      const dAmp = CONFIG.displacement * MAX_DISP;
      const { threshold, ceiling } = CONFIG;

      // ── Wind gust pre-computation ─────────────────────────────────────────
      // gustCenter is in col-space, advancing at windSpeed cols/second.
      // The period includes full entry from left and exit to right so there's
      // no visible pop when it wraps.
      const halfW      = CONFIG.windWidth * cols;
      const gustPeriod = cols + 2 * halfW;
      const gustCenter = ((t * CONFIG.windSpeed) % gustPeriod) - halfW;

      for (let row = 0; row < rows; row++) {
        // Vertical wobble: shifts the gust center per row so the leading edge
        // has a soft diagonal ripple rather than a ruler-straight vertical bar.
        const rowFrac       = row / Math.max(1, rows - 1);
        const wobble        = Math.sin(rowFrac * Math.PI * 2.5 + t * 0.3) * CONFIG.windWobble * cols;
        const gustColCenter = gustCenter + wobble;

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

          const base = (alpha - threshold) / (ceiling - threshold);

          // ── Wind brightness ───────────────────────────────────────────────
          // sin² envelope: smooth hill, peaks at 1 at center, 0 at ±halfW.
          const dist           = Math.abs(col - gustColCenter);
          const windBrightness = dist < halfW
            ? Math.pow(Math.sin((1 - dist / halfW) * Math.PI * 0.5), 2) * CONFIG.windBoost
            : 0;

          const modulated = Math.min(1, Math.max(0.05, base + wave + windBrightness));
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
      if (PW !== lastPW || PH !== lastPH || dpr !== lastDpr) {
        canvas!.width  = PW;
        canvas!.height = PH;
        lastPW  = PW;
        lastPH  = PH;
        lastDpr = dpr;
      }
      const ctx = canvas!.getContext("2d")!;
      ctx.clearRect(0, 0, PW, PH);
      ctx.drawImage(offAscii, 0, 0);

      frame++;
    }

    // ── FPS cap via setTimeout → rAF ─────────────────────────────────────────
    const interval = 1000 / CONFIG.fps;

    function scheduleNext() {
      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(() => {
          render();
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