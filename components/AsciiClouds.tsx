"use client";

import { useEffect, useRef } from "react";

// --- CONFIG -------------------------------------------------------------------
const CONFIG = {
  cellSize: 8,
  
  // -- Intro Sequence --
  introStartSize: 200,
  introDuration: 3.5,  // 600ms to allow the Expo tail to glide smoothly
  introSlideY: 0.3,    // Slide up translation (20% of screen height)

  threshold: 0,
  ceiling: 1,
  speed: 5,
  waveDepth: 0.6,
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cvs = canvas;
    const ctx = cvs.getContext("2d")!;

    function getEffectiveDpr(): number {
      const vvScale = window.visualViewport?.scale ?? 1;
      return (window.devicePixelRatio || 1) * vvScale;
    }
    
    // Master image data memory block
    let imgData: Uint8ClampedArray | null = null;
    let imgW = 0;
    let imgH = 0;

    let cachedDpr = 0;
    let cachedTileSize = 0;
    let glyphAtlas: Uint8Array[][] = [];

    const offOut    = document.createElement("canvas");
    const offOutCtx = offOut.getContext("2d", { willReadFrequently: true })!;
    let outImageData: ImageData | null = null;
    let outBuf:  Uint8ClampedArray | null = null;
    let outBuf32: Uint32Array | null = null;

    // Reusable cached mapping arrays
    let colPx = new Int32Array(0);
    let rowPx = new Int32Array(0);
    let pxCols = new Int32Array(0);
    let pxRows = new Int32Array(0);
    
    let cachedImageCols = 0;
    let cachedImageRows = 0;
    let cachedGridCols = 0;
    let cachedGridRows = 0;
    let cachedGridPW   = 0;
    let cachedGridPH   = 0;
    let gustRowCache: Float32Array | null = null;
    let wasIntro = true; // Fixes fractional offset bug

    let lastPW = 0, lastPH = 0, lastDpr = 0;
    let startTime = performance.now();

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
      const reqSize = rows * cols;
      if (!gustRowCache || gustRowCache.length < reqSize) {
        gustRowCache = new Float32Array(reqSize);
      }
      const map = gustRowCache;
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

    function render(now: number) {
      if (!imgData) return;
      const W = currentW, H = currentH;
      if (W === 0 || H === 0) return;

      const t   = (now - startTime) / 1000;
      const dpr = getEffectiveDpr();

      // -- Intro interpolation (Aggressive Expo Ease-In-Out) -------------------
      const isIntro = t < CONFIG.introDuration;
      let currentCellSize = CONFIG.cellSize;
      let introOffsetNorm = 0;
      
      if (isIntro) {
        const progress = t / CONFIG.introDuration;
        
        // Warping progress with a 0.3 power compresses the entire start-to-snap
        // phase into the first ~10% of the timeline (approx. 0.35 seconds).
        const warped = Math.pow(progress, 0.35);

        const ease = warped === 0 ? 0 : warped === 1 ? 1 : warped < 0.5 
          ? Math.pow(2, 20 * warped - 10) / 2 
          : (2 - Math.pow(2, -20 * warped + 10)) / 2;

        const calculatedSize = CONFIG.introStartSize * Math.pow(CONFIG.cellSize / CONFIG.introStartSize, ease);
        currentCellSize = Math.min(200, calculatedSize); // Guard against render lag
        introOffsetNorm = CONFIG.introSlideY * (1 - ease);
      }


      const PW   = Math.round(W * dpr);
      const PH   = Math.round(H * dpr);
      const cols = Math.max(1, Math.floor(W / currentCellSize));
      const rows = Math.max(1, Math.floor(H / currentCellSize));

      const targetTileSize = Math.ceil(CONFIG.cellSize * dpr);
      if (targetTileSize !== cachedTileSize || dpr !== cachedDpr) {
        cachedDpr = dpr;
        cachedTileSize = targetTileSize;
        glyphAtlas = buildGlyphAtlas(targetTileSize);
      }

      // -- 1. Fast Native Image Coordinates Map ------------------------------
      // wasIntro check ensures the offset locks perfectly to 0 on the exact frame the intro completes
      if (cols !== cachedImageCols || rows !== cachedImageRows || isIntro || wasIntro) {
        if (pxCols.length < cols) pxCols = new Int32Array(cols);
        if (pxRows.length < rows) pxRows = new Int32Array(rows);
        
        for (let c = 0; c < cols; c++) {
          pxCols[c] = Math.min(imgW - 1, Math.floor(((c + 0.5) / cols) * imgW));
        }
        for (let r = 0; r < rows; r++) {
          const normY = (r + 0.5) / rows - introOffsetNorm;
          if (normY < 0 || normY >= 1) {
            pxRows[r] = -1; // Marks as out of bounds transparency
          } else {
            pxRows[r] = Math.min(imgH - 1, Math.floor(normY * imgH));
          }
        }
        
        cachedImageCols = cols;
        cachedImageRows = rows;
        if (isIntro) gusts.length = 0; 
        wasIntro = isIntro;
      }

      // -- 2. Gust Map -------------------------------------------------------
      let gustMap: Float32Array | null = null;
      if (!isIntro) {
        updateGusts(t, cols);
        gustMap = buildGustMap(rows, cols, t);
      }

      // -- 3. Bresenham Grid --------------------------------------------------
      if (cols !== cachedGridCols || PW !== cachedGridPW) {
        if (colPx.length < cols + 1) colPx = new Int32Array(cols + 1);
        for (let c = 0; c <= cols; c++) colPx[c] = Math.round(c * PW / cols);
        cachedGridCols = cols;
        cachedGridPW   = PW;
      }
      if (rows !== cachedGridRows || PH !== cachedGridPH) {
        if (rowPx.length < rows + 1) rowPx = new Int32Array(rows + 1);
        for (let r = 0; r <= rows; r++) rowPx[r] = Math.round(r * PH / rows);
        cachedGridRows = rows;
        cachedGridPH   = PH;
      }

      // -- 4. Output buffer --------------------------------------------------
      if (PW !== lastPW || PH !== lastPH || dpr !== lastDpr) {
        offOut.width  = PW;
        offOut.height = PH;
        outImageData  = offOutCtx.createImageData(PW, PH);
        outBuf        = outImageData.data;
        outBuf32      = new Uint32Array(outBuf.buffer);
        outBuf.fill(255);
        lastPW = PW; lastPH = PH; lastDpr = dpr;
      }

      const buf   = outBuf!;
      const buf32 = outBuf32!;
      const s     = CONFIG.speed * 0.018;
      const wAmp  = CONFIG.waveDepth * 0.3;
      const dAmp  = CONFIG.displacement * 2;
      const { threshold, ceiling } = CONFIG;
      const thresholdD2 = threshold * 0.5 + 0.05;
      const ceilMinThr  = ceiling - threshold;

      buf32.fill(0x00FFFFFF);
      const activeTileSize = cachedTileSize;

      // -- 5. Main loop ------------------------------------------------------
      for (let row = 0; row < rows; row++) {
        const rowBase = row * cols;
        const pyStart = rowPx[row];

        for (let col = 0; col < cols; col++) {
          const ni = ((row % NOISE_H) * NOISE_W + (col % NOISE_W)) * 5;

          const dPhase = NOISE[ni + 2], dDir = NOISE[ni + 3], dSpeed = NOISE[ni + 4];
          const disp   = Math.sin(t * s * dSpeed + dPhase) * dAmp * dDir;
          let srcRow   = (row + disp + 0.5) | 0;
          if (srcRow < 0) srcRow = 0;
          else if (srcRow >= rows) srcRow = rows - 1;
          
          const pYMask = pxRows[srcRow];
          if (pYMask < 0) continue;
          const maskAlpha = imgData[(pYMask * imgW + pxCols[col]) * 4 + 3];
          if (maskAlpha === 0) continue;

          const pYRaw = pxRows[row];
          if (pYRaw < 0) continue;
          const alpha = imgData[(pYRaw * imgW + pxCols[col]) * 4 + 3] / 255;
          if (alpha < threshold) continue;

          const bPhase = NOISE[ni], bSpeed = NOISE[ni + 1];
          const wave   = Math.sin(t * s * bSpeed * 1.3 + bPhase) * wAmp + Math.sin(t * s * bSpeed * 0.6 + bPhase * 1.9) * wAmp * 0.4;
          
          const gVal = gustMap ? gustMap[rowBase + col] : 0;
          const modulated = Math.min(1, Math.max(0.05, (alpha - threshold) / ceilMinThr + wave + gVal));
          const charIdx  = Math.floor(modulated * (CHARS.length - 1));
          const alphaIdx = Math.min(ALPHA_STEPS - 1, Math.floor(Math.min(1, alpha / thresholdD2) * ALPHA_STEPS));
          const tile = glyphAtlas[charIdx][alphaIdx];

          const pxStart   = colPx[col];
          const cellW     = colPx[col + 1] - pxStart;
          const cellH     = rowPx[row + 1] - pyStart;

          const rowStride = PW * 4;
          const dstBase   = (pyStart * PW + pxStart) * 4;

          const scaleX = activeTileSize / cellW;
          const scaleY = activeTileSize / cellH;

          // Inner rendering loop 
          for (let ty = 0; ty < cellH; ty++) {
            let srcY = (ty * scaleY) | 0;
            if (srcY >= activeTileSize) srcY = activeTileSize - 1;
            const tileRowOff = srcY * activeTileSize;
            const dstRowOff  = dstBase + ty * rowStride;
            
            for (let tx = 0; tx < cellW; tx++) {
              let srcX = (tx * scaleX) | 0;
              if (srcX >= activeTileSize) srcX = activeTileSize - 1;
              const glyphA = tile[tileRowOff + srcX];
              if (glyphA === 0) continue;
              
              buf[dstRowOff + tx * 4 + 3] = (glyphA * maskAlpha) >> 8;
            }
          }
        }
      }

      // -- 6. Flush ----------------------------------------------------------
      offOutCtx.putImageData(outImageData!, 0, 0);
      if (cvs.width !== PW || cvs.height !== PH) {
        cvs.width  = PW;
        cvs.height = PH;
      }
      
      ctx.clearRect(0, 0, PW, PH); 
      ctx.drawImage(offOut, 0, 0);
    }

    // -- Dynamic FPS rAF Loop -------------------------------------------------
    let lastRenderTime = performance.now();

    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);
      const t = (now - startTime) / 1000;
      
      const isIntro = t < CONFIG.introDuration;

      // Unthrottled render during Intro to hit max native refresh-rate (60fps+)
      if (isIntro) {
        render(now);
        lastRenderTime = now;
      } else {
        // Fall back to stylized cinematic target FPS
        const interval = 1000 / CONFIG.fps;
        if (now - lastRenderTime >= interval) {
          lastRenderTime = now - ((now - lastRenderTime) % interval);
          render(now);
        }
      }
    }

    const img = new Image();
    img.src = "/assets/clouds.png";

    img.onload = () => {
      // Decode image raw data entirely ONCE. 
      const tempCvs = document.createElement("canvas");
      tempCvs.width = img.naturalWidth;
      tempCvs.height = img.naturalHeight;
      const tCtx = tempCvs.getContext("2d", { willReadFrequently: true })!;
      tCtx.drawImage(img, 0, 0);
      
      imgData = tCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
      imgW = img.naturalWidth;
      imgH = img.naturalHeight;

      startTime = performance.now();
      lastRenderTime = startTime;
      rafRef.current = requestAnimationFrame(loop);
    };

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
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