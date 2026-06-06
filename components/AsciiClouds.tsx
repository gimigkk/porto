"use client";

import { useEffect, useRef } from "react";

// --- CONFIG -------------------------------------------------------------------
const CONFIG = {
  cellSize: 8,
  threshold: 0,
  ceiling: 1,
  speed: 5,
  waveDepth: 0.3,
  displacement: 0.6,
  fps: 10,

  // -- Wind gusts --
  maxGusts: 4,
  spawnInterval: 2.5,
  windWobble: 0.22,
  gustMinSpeed: 10,
  gustMaxSpeed: 20,
  gustMinWidth: 0.09,
  gustMaxWidth: 0.12,

  // -- Gust angle --
  gustMinTilt: 0.15,
  gustMaxTilt: 0.45,
};
// -----------------------------------------------------------------------------

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

// --- Glyph pixel atlas -------------------------------------------------------
// Each glyph tile is a Uint8Array of alpha values (R/G/B assumed 255).
// tileSize is the atlas tile dimension (square). The actual blit region for
// each cell may be tileSize or tileSize+1 px wide/tall (Bresenham-style) but
// the tile is always sampled at tileSize resolution.
const ALPHA_STEPS = 16;

function buildGlyphAtlas(tileSize: number): Uint8Array[][] {
  return CHARS.split("").map((ch) =>
    Array.from({ length: ALPHA_STEPS }, (_, ai) => {
      const opacity = (ai + 1) / ALPHA_STEPS;
      const gc = document.createElement("canvas");
      gc.width = gc.height = tileSize;
      const gx = gc.getContext("2d")!;
      gx.font = `bold ${tileSize}px monospace`;
      gx.textBaseline = "top";
      gx.fillStyle = `rgba(255,255,255,${opacity.toFixed(3)})`;
      gx.fillText(ch, 0, 0);
      const raw   = gx.getImageData(0, 0, tileSize, tileSize).data;
      const alpha = new Uint8Array(tileSize * tileSize);
      for (let i = 0; i < alpha.length; i++) alpha[i] = raw[i * 4 + 3];
      return alpha;
    })
  );
}

// --- Gust type ----------------------------------------------------------------
interface Gust {
  id: number;
  center: number;
  speed: number;
  halfWidthFrac: number;
  boost: number;
  wobble: number;
  wobbleFreq: number;
  wobblePhase: number;
  tilt: number;
  edgeNoise: Float32Array;
  born: number;
  fadeIn: number;
  fadeOut: number;
  life: number;
  dead: boolean;
}

const gustRng = mulberry32(0xdeadbeef);
let gustIdCounter = 0;

function spawnGust(t: number, cols: number): Gust {
  const r = () => gustRng();
  const leftToRight  = r() > 0.5;
  const speed        = (CONFIG.gustMinSpeed + r() * (CONFIG.gustMaxSpeed - CONFIG.gustMinSpeed)) * (leftToRight ? 1 : -1);
  const halfWidthFrac = CONFIG.gustMinWidth + r() * (CONFIG.gustMaxWidth - CONFIG.gustMinWidth);
  const halfW        = halfWidthFrac * cols;
  const spawnInMiddle = r() < 0.3;
  const startCenter  = spawnInMiddle
    ? halfW + r() * (cols - 2 * halfW)
    : leftToRight ? -halfW : cols + halfW;
  const life    = (cols + 2 * halfW) / Math.abs(speed) + r() * 1.5;
  const fadeIn  = 0.4 + r() * 0.8;
  const fadeOut = 0.4 + r() * 0.8;
  const tiltSign = r() > 0.5 ? 1 : -1;
  const tilt     = tiltSign * (CONFIG.gustMinTilt + r() * (CONFIG.gustMaxTilt - CONFIG.gustMinTilt));

  const EDGE_SAMPLES = 32;
  const ctrlPts  = new Float32Array(EDGE_SAMPLES + 1);
  for (let i = 0; i <= EDGE_SAMPLES; i++) ctrlPts[i] = r() * 2 - 1;
  const edgeNoise = new Float32Array(cols);
  for (let c = 0; c < cols; c++) {
    const frac = (c / Math.max(1, cols - 1)) * EDGE_SAMPLES;
    const lo   = Math.floor(frac);
    const hi   = Math.min(EDGE_SAMPLES, lo + 1);
    const t0   = frac - lo;
    const sm   = t0 * t0 * (3 - 2 * t0);
    edgeNoise[c] = ctrlPts[lo] * (1 - sm) + ctrlPts[hi] * sm;
  }

  return {
    id: ++gustIdCounter, center: startCenter, speed, halfWidthFrac, tilt,
    boost: 0.08 + r() * 0.14, wobble: 0.05 + r() * 0.25,
    wobbleFreq: 1.5 + r() * 3.0, wobblePhase: r() * Math.PI * 2,
    edgeNoise, born: t, fadeIn, fadeOut, life, dead: false,
  };
}

export default function AsciiClouds({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cvs = canvas;
    const ctx = cvs.getContext("2d")!;

    function getEffectiveDpr(): number {
      const vvScale = window.visualViewport?.scale ?? 1;
      return (window.devicePixelRatio || 1) * vvScale;
    }
    let cachedDpr  = getEffectiveDpr();
    let tileSize   = Math.ceil(CONFIG.cellSize * cachedDpr);
    let glyphAtlas = buildGlyphAtlas(tileSize);

    const offSample    = document.createElement("canvas");
    const offSampleCtx = offSample.getContext("2d", { willReadFrequently: true })!;

    // Single output ImageData written entirely in JS — one putImageData per frame.
    // RGB channels are pre-set to 255 (white) and never touched again.
    // Only the alpha channel is written each frame.
    const offOut    = document.createElement("canvas");
    const offOutCtx = offOut.getContext("2d")!;
    let outImageData: ImageData | null = null;
    let outBuf:  Uint8ClampedArray | null = null;
    let outBuf32: Uint32Array | null = null;

    let cachedPx:    Uint8ClampedArray | null = null;
    let cachedPxCols = 0;
    let cachedPxRows = 0;
    let gustRowCache: Float32Array | null = null;

    // Precomputed per-column and per-row pixel origins.
    // colPx[c] = first physical pixel x for column c
    // rowPx[r] = first physical pixel y for row r
    // These are recomputed whenever cols/rows/PW/PH change.
    let colPx: Int32Array | null = null;
    let rowPx: Int32Array | null = null;
    let cachedColCount = 0;
    let cachedRowCount = 0;
    let cachedGridPW   = 0;
    let cachedGridPH   = 0;

    const img = new Image();
    img.src = "/assets/clouds.png";

    const MAX_DISP = 2;
    let lastPW = 0, lastPH = 0, lastDpr = 0;
    const startTime = performance.now();

    let currentW = 0, currentH = 0;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e.contentBoxSize) {
        currentW = e.contentBoxSize[0].inlineSize;
        currentH = e.contentBoxSize[0].blockSize;
      } else {
        currentW = e.contentRect.width;
        currentH = e.contentRect.height;
      }
    });
    ro.observe(cvs);
    { const r = cvs.getBoundingClientRect(); currentW = r.width; currentH = r.height; }

    // -- Gust state ------------------------------------------------------------
    const gusts: Gust[] = [];
    let lastSpawnTime = -CONFIG.spawnInterval;

    function updateGusts(t: number, cols: number) {
      for (let i = gusts.length - 1; i >= 0; i--) {
        if (t - gusts[i].born > gusts[i].life) gusts.splice(i, 1);
      }
      if (
        gusts.length < CONFIG.maxGusts &&
        t - lastSpawnTime >= CONFIG.spawnInterval * (0.5 + gustRng() * 1.0)
      ) {
        gusts.push(spawnGust(t, cols));
        lastSpawnTime = t;
      }
    }

    function buildGustMap(rows: number, cols: number, t: number): Float32Array {
      const map = gustRowCache!;
      map.fill(0);
      for (const g of gusts) {
        const age   = t - g.born;
        const halfW = g.halfWidthFrac * cols;
        let fade = 1;
        if (age < g.fadeIn)                fade = age / g.fadeIn;
        else if (age > g.life - g.fadeOut) fade = (g.life - age) / g.fadeOut;
        if (fade <= 0) continue;
        if (fade > 1)  fade = 1;

        const center      = g.center + g.speed * age;
        const boostFade   = g.boost * fade;
        const wobbleScale = g.wobble * halfW;
        const halfWInv    = 1 / halfW;
        const tS1 = t * 0.25 + g.wobblePhase;
        const tS2 = t * 0.41 + g.wobblePhase * 1.7;
        const tS3 = t * 0.13;
        const wf1 = g.wobbleFreq, wf2 = g.wobbleFreq * 2.3, wf3 = g.wobbleFreq * 0.5;

        for (let row = 0; row < rows; row++) {
          const rowFrac   = row / Math.max(1, rows - 1);
          const tiltShift = g.tilt * (rowFrac - 0.5) * rows;
          const rfPi          = rowFrac * Math.PI;
          const sin2_unscaled = Math.sin(rfPi * wf2 + tS2);
          const sin1_r        = Math.sin(rfPi * wf1 + tS1);
          const sin2_r        = sin2_unscaled * 0.45;
          const sin3_r        = Math.sin(rfPi * wf3 + tS3) * 0.25;
          const rowCenter     = center + tiltShift + (sin1_r + sin2_r + sin3_r) * wobbleScale;
          const cos1_r = Math.cos(rfPi * wf1 + tS1);
          const cos2_r = Math.cos(rfPi * wf2 + tS2);
          const cos3_r = Math.cos(rfPi * wf3 + tS3);

          const colMin = Math.max(0,    Math.ceil(rowCenter  - halfW - wobbleScale)) | 0;
          const colMax = Math.min(cols, Math.floor(rowCenter + halfW + wobbleScale)) | 0;
          const rowBase = row * cols;

          for (let col = colMin; col < colMax; col++) {
            const cn  = g.edgeNoise[col] * 2.1;
            const cn2 = g.edgeNoise[col] * 3.9;
            const cn3 = g.edgeNoise[col] * 1.3;
            const sinCn  = Math.sin(cn),  cosCn  = Math.cos(cn);
            const sinCn2 = Math.sin(cn2), cosCn2 = Math.cos(cn2);
            const sinCn3 = Math.sin(cn3), cosCn3 = Math.cos(cn3);
            const no1 = (sin1_r        * cosCn  + cos1_r * sinCn);
            const no2 = (sin2_unscaled * cosCn2 + cos2_r * sinCn2) * 0.45;
            const no3 = (sin3_r        * cosCn3 + cos3_r * sinCn3) * 0.25;
            const dist = Math.abs(col - (center + tiltShift + (no1 + no2 + no3) * wobbleScale));
            if (dist < halfW) {
              const x = Math.sin((1 - dist * halfWInv) * (Math.PI * 0.5));
              map[rowBase + col] += x * x * x * x * boostFade;
            }
          }
        }
      }
      return map;
    }

    function render() {
      if (!img.complete || img.naturalWidth === 0) return;
      const W = currentW, H = currentH;
      if (W === 0 || H === 0) return;

      const t   = (performance.now() - startTime) / 1000;
      const dpr = getEffectiveDpr();
      const cs  = CONFIG.cellSize;

      if (Math.abs(dpr - cachedDpr) > 0.001) {
        cachedDpr  = dpr;
        tileSize   = Math.ceil(cs * dpr);
        glyphAtlas = buildGlyphAtlas(tileSize);
      }

      const PW   = Math.round(W * dpr);
      const PH   = Math.round(H * dpr);
      const cols = Math.floor(W / cs);
      const rows = Math.floor(H / cs);

      updateGusts(t, cols);

      // -- 1. Sample cloud image (only on grid resize) -----------------------
      if (cols !== cachedPxCols || rows !== cachedPxRows) {
        offSample.width  = cols;
        offSample.height = rows;
        offSampleCtx.drawImage(img, 0, 0, cols, rows);
        cachedPx     = offSampleCtx.getImageData(0, 0, cols, rows).data;
        cachedPxCols = cols;
        cachedPxRows = rows;
        gustRowCache = new Float32Array(rows * cols);
      }
      const px = cachedPx!;

      // -- 2. Build gust map -------------------------------------------------
      const gustMap = buildGustMap(rows, cols, t);

      // -- 3. Recompute pixel-origin lookup tables when grid or canvas size changes.
      //
      // THE CORE FIX: instead of placing cell (col, row) at (col*phys, row*phys),
      // we use Math.round(col * PW / cols) for each column independently.
      // This is the Bresenham / "painter's algorithm" approach: each cell's
      // origin is derived from the total canvas width, so rounding errors never
      // accumulate across columns. Adjacent cells may be tileSize or tileSize+1
      // physical pixels wide, but they perfectly tile [0, PW) with zero gaps
      // and zero overlaps at every zoom level.
      if (cols !== cachedColCount || PW !== cachedGridPW) {
        colPx = new Int32Array(cols + 1);
        for (let c = 0; c <= cols; c++) colPx[c] = Math.round(c * PW / cols);
        cachedColCount = cols;
        cachedGridPW   = PW;
      }
      if (rows !== cachedRowCount || PH !== cachedGridPH) {
        rowPx = new Int32Array(rows + 1);
        for (let r = 0; r <= rows; r++) rowPx[r] = Math.round(r * PH / rows);
        cachedRowCount = rows;
        cachedGridPH   = PH;
      }
      const cpx = colPx!;
      const rpx = rowPx!;

      // -- 4. Resize output buffer (only on PW/PH/dpr change) ----------------
      if (PW !== lastPW || PH !== lastPH || dpr !== lastDpr) {
        offOut.width  = PW;
        offOut.height = PH;
        outImageData  = offOutCtx.createImageData(PW, PH);
        outBuf        = outImageData.data;
        outBuf32      = new Uint32Array(outBuf.buffer);
        // Pre-fill all pixels as opaque white once; we only update alpha per frame.
        outBuf.fill(255);
        lastPW = PW; lastPH = PH; lastDpr = dpr;
      }

      const buf   = outBuf!;
      const buf32 = outBuf32!;
      const s     = CONFIG.speed * 0.018;
      const wAmp  = CONFIG.waveDepth * 0.3;
      const dAmp  = CONFIG.displacement * MAX_DISP;
      const { threshold, ceiling } = CONFIG;
      const thresholdD2 = threshold * 0.5 + 0.05;
      const ceilMinThr  = ceiling - threshold;

      // -- 5. Clear alpha plane via Uint32Array ------------------------------
      buf32.fill(0x00FFFFFF);

      // -- 6. Main loop: blit glyph alphas into output buffer ----------------
      for (let row = 0; row < rows; row++) {
        const rowBase  = row * cols;
        const pyStart  = rpx[row];

        for (let col = 0; col < cols; col++) {
          const ni = ((row % NOISE_H) * NOISE_W + (col % NOISE_W)) * 5;

          // Displaced cloud alpha (mask)
          const dPhase = NOISE[ni + 2], dDir = NOISE[ni + 3], dSpeed = NOISE[ni + 4];
          const disp   = Math.sin(t * s * dSpeed + dPhase) * dAmp * dDir;
          let srcRow   = (row + disp + 0.5) | 0;
          if (srcRow < 0) srcRow = 0;
          else if (srcRow >= rows) srcRow = rows - 1;
          const maskAlpha = px[(srcRow * cols + col) * 4 + 3];
          if (maskAlpha === 0) continue;

          // Undisplaced alpha for glyph selection
          const alpha = px[(rowBase + col) * 4 + 3] / 255;
          if (alpha < threshold) continue;

          // Pick glyph
          const bPhase = NOISE[ni], bSpeed = NOISE[ni + 1];
          const wave   =
            Math.sin(t * s * bSpeed * 1.3 + bPhase) * wAmp +
            Math.sin(t * s * bSpeed * 0.6 + bPhase * 1.9) * wAmp * 0.4;
          const modulated = Math.min(1, Math.max(0.05,
            (alpha - threshold) / ceilMinThr + wave + gustMap[rowBase + col]));
          const charIdx  = Math.floor(modulated * (CHARS.length - 1));
          const alphaIdx = Math.min(ALPHA_STEPS - 1,
            Math.floor(Math.min(1, alpha / thresholdD2) * ALPHA_STEPS));
          const tile = glyphAtlas[charIdx][alphaIdx];

          // Blit tile using per-cell pixel origins from the lookup tables.
          // pxStart/cellW come from the precomputed Bresenham grid, so tiles
          // butt up perfectly — no gap, no overlap, even at fractional DPRs.
          const pxStart   = cpx[col];
          const rowStride = PW * 4;
          const dstBase   = (pyStart * PW + pxStart) * 4;

          // Blit exactly tileSize×tileSize atlas pixels — 1:1, no stretching.
          // The Bresenham cell may be tileSize or tileSize+1 px wide/tall; we
          // simply don't write the extra pixel. It stays transparent (cleared
          // by buf32.fill above) so no grid-line seam appears.
          for (let ty = 0; ty < tileSize; ty++) {
            const tileRowOff = ty * tileSize;
            const dstRowOff  = dstBase + ty * rowStride;
            for (let tx = 0; tx < tileSize; tx++) {
              const glyphA = tile[tileRowOff + tx];
              if (glyphA === 0) continue;
              buf[dstRowOff + tx * 4 + 3] = (glyphA * maskAlpha) >> 8;
            }
          }
        }
      }

      // -- 7. Flush: one putImageData + one drawImage ------------------------
      offOutCtx.putImageData(outImageData!, 0, 0);
      if (cvs.width !== PW || cvs.height !== PH) {
        cvs.width  = PW;
        cvs.height = PH;
      }
      ctx.clearRect(0, 0, PW, PH);
      ctx.drawImage(offOut, 0, 0);
    }

    // -- FPS cap via setTimeout → rAF -----------------------------------------
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
      ro.disconnect();
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