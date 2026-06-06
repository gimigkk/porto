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
  // ── Wind gusts ─────────────────────────────────────────────────────────────
  maxGusts: 4,          // maximum concurrent gusts
  spawnInterval: 2.5,   // seconds between spawn attempts
  windWobble: 0.22,     // vertical sine wobble on the gust edge (fraction of rows)
  gustMinSpeed: 10,     // cols/sec
  gustMaxSpeed: 20,     // cols/sec
  gustMinWidth: 0.09,   // half-width as fraction of cols
  gustMaxWidth: 0.12,   // half-width as fraction of cols
};
// ─────────────────────────────────────────────────────────────────────────────

const CHARS = ".:/#@G";

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

// ─── Gust type ────────────────────────────────────────────────────────────────
interface Gust {
  id: number;
  // Current center position in col-space
  center: number;
  // Speed in cols/sec, negative = right-to-left
  speed: number;
  // Half-width as fraction of cols
  halfWidthFrac: number;
  // Peak brightness boost
  boost: number;
  // Wobble amplitude as fraction of rows
  wobble: number;
  // Wobble frequency multiplier
  wobbleFreq: number;
  // Wobble phase offset
  wobblePhase: number;
  // Per-column noise offsets for organic edge shape (length = cols)
  edgeNoise: Float32Array;
  // Fade-in/-out envelope (0→1→0 over lifetime)
  born: number;   // time of spawn (seconds)
  fadeIn: number; // duration of fade-in (seconds)
  fadeOut: number;// duration of fade-out (seconds)
  life: number;   // total lifetime (seconds)
  dead: boolean;
}

// Seeded random for gust generation (separate from noise rng)
const gustRng = mulberry32(0xdeadbeef);

let gustIdCounter = 0;

function spawnGust(t: number, cols: number): Gust {
  const r = () => gustRng();

  const leftToRight = r() > 0.5;
  const speed = (CONFIG.gustMinSpeed + r() * (CONFIG.gustMaxSpeed - CONFIG.gustMinSpeed)) * (leftToRight ? 1 : -1);

  // Spawn origin: edge (70% chance) or random middle position (30% chance)
  const spawnInMiddle = r() < 0.3;
  let startCenter: number;
  const halfWidthFrac = CONFIG.gustMinWidth + r() * (CONFIG.gustMaxWidth - CONFIG.gustMinWidth);
  const halfW = halfWidthFrac * cols;

  if (spawnInMiddle) {
    // Appear somewhere mid-canvas
    startCenter = halfW + r() * (cols - 2 * halfW);
  } else {
    // Enter from the appropriate edge
    startCenter = leftToRight ? -halfW : cols + halfW;
  }

  const life = (cols + 2 * halfW) / Math.abs(speed) + r() * 1.5;
  const fadeIn  = 0.4 + r() * 0.8;
  const fadeOut = 0.4 + r() * 0.8;

  // Build per-column edge-noise table: 4 octaves of random offsets
  // sampled at a coarse resolution then linearly interpolated so the
  // shape looks organic rather than purely periodic.
  const EDGE_SAMPLES = 32; // control points
  const ctrlPts = new Float32Array(EDGE_SAMPLES + 1);
  for (let i = 0; i <= EDGE_SAMPLES; i++) ctrlPts[i] = r() * 2 - 1; // [-1, 1]

  const edgeNoise = new Float32Array(cols);
  for (let c = 0; c < cols; c++) {
    const frac  = (c / Math.max(1, cols - 1)) * EDGE_SAMPLES;
    const lo    = Math.floor(frac);
    const hi    = Math.min(EDGE_SAMPLES, lo + 1);
    const t0    = frac - lo;
    // Smooth-step interpolation
    const sm    = t0 * t0 * (3 - 2 * t0);
    edgeNoise[c] = ctrlPts[lo] * (1 - sm) + ctrlPts[hi] * sm;
  }

  return {
    id: ++gustIdCounter,
    center: startCenter,
    speed,
    halfWidthFrac,
    boost: 0.08 + r() * 0.14,       // 0.08–0.22: subtle lift, never flatlines
    wobble: 0.05 + r() * 0.25,
    wobbleFreq: 1.5 + r() * 3.0,
    wobblePhase: r() * Math.PI * 2,
    edgeNoise,
    born: t,
    fadeIn,
    fadeOut,
    life,
    dead: false,
  };
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

    const startTime = performance.now();
    let frame = 0;

    // ── Gust state ────────────────────────────────────────────────────────────
    const gusts: Gust[] = [];
    let lastSpawnTime = -CONFIG.spawnInterval; // spawn immediately on first frame

    function updateGusts(t: number, cols: number) {
      // Advance existing gusts
      // (position is computed per-frame from born+speed, not mutated here)

      // Cull dead gusts
      for (let i = gusts.length - 1; i >= 0; i--) {
        const g = gusts[i];
        const age = t - g.born;
        if (age > g.life) {
          gusts.splice(i, 1);
        }
      }

      // Spawn new gusts
      if (
        gusts.length < CONFIG.maxGusts &&
        t - lastSpawnTime >= CONFIG.spawnInterval * (0.5 + gustRng() * 1.0)
      ) {
        gusts.push(spawnGust(t, cols));
        lastSpawnTime = t;
      }
    }

    function gustBrightnessAt(col: number, row: number, rows: number, t: number, cols: number): number {
      let total = 0;
      for (const g of gusts) {
        const age   = t - g.born;
        const halfW = g.halfWidthFrac * cols;

        // Fade envelope
        let fade = 1;
        if (age < g.fadeIn)                fade = age / g.fadeIn;
        else if (age > g.life - g.fadeOut) fade = (g.life - age) / g.fadeOut;
        fade = Math.max(0, Math.min(1, fade));

        // Current center
        const center = g.center + g.speed * age;

        // ── Organic edge wobble ───────────────────────────────────────────
        // Three sine octaves (different frequencies & drift speeds) give a
        // turbulent, non-repeating look. The per-column edgeNoise value
        // seeds each column's phase so adjacent columns evolve differently.
        const colNoise  = g.edgeNoise[Math.min(cols - 1, Math.max(0, col))];
        const rowFrac   = row / Math.max(1, rows - 1);

        const o1 = Math.sin(rowFrac * Math.PI * g.wobbleFreq       + t * 0.25 + g.wobblePhase + colNoise * 2.1);
        const o2 = Math.sin(rowFrac * Math.PI * g.wobbleFreq * 2.3 + t * 0.41 + g.wobblePhase * 1.7 + colNoise * 3.9) * 0.45;
        const o3 = Math.sin(rowFrac * Math.PI * g.wobbleFreq * 0.5 + t * 0.13 + colNoise * 1.3) * 0.25;

        const wobble    = (o1 + o2 + o3) * g.wobble * halfW;
        const effCenter = center + wobble;

        const dist = Math.abs(col - effCenter);
        if (dist < halfW) {
          // sin^4 gives a narrower, more pointed core than sin^2
          const env = Math.pow(Math.sin((1 - dist / halfW) * Math.PI * 0.5), 4);
          total += env * g.boost * fade;
        }
      }
      return total;
    }

    function render() {
      if (!img.complete || img.naturalWidth === 0) return;

      const rect = canvas!.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      if (W === 0 || H === 0) return;

      const t   = (performance.now() - startTime) / 1000;
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

      // Update gust pool
      updateGusts(t, cols);

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

          const base = (alpha - threshold) / (ceiling - threshold);

          const windBrightness = gustBrightnessAt(col, row, rows, t, cols);

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