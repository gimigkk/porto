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
  fps: 60,             // Visual render framerate

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

  // -- Blobs (Smoke puffs) --
  blobCount: 20,             // Maximum active particles on screen
  blobSpawnChance: 0.18,     // Spawn rate factor
  blobLife: [3.5, 6.0],      // Lifetime in seconds
  blobRadius: [12, 62],      // Refined puff size for elegant smoke contours
  blobSpeedY: [-65, -20],    // Graceful, slower vertical speed (negative = upwards)
  blobAmbientWind: 12.0,     // Gentle background horizontal breeze
  blobWindPush: 10.0,        // Strength of gust wind blowing particles sideways

  // -- Cursor Disruptor --
  cursorDisruptor: {
    enabled: true,
    minSpeedToSpawn: 40,        // Minimum pointer speed (px/sec) to generate wind trails
    maxSpeedReference: 2500,    // Speed at which the effect hits maximum intensity
    maxIntensity: 0.45,         // Maximum displacement depth (-1.0 to 1.0 pressure range)
    particleLife: 1.2,          // Lifespan of trail particles (seconds)
    minRadius: 3.0,             // Minimum trail radius (in grid cells) for slow speeds
    maxRadius: 10.0,            // Maximum trail radius (in grid cells) for fast speeds
    expansionFactor: 3.5,       // Scale multiplier for dispersion as particles age (1.0 = no expansion)
    trailFling: 0.28,           // Speed multiplier transferred to trail drift
    pushRadius: 180,            // Physical push radius for smoke blobs (in image pixels)
    pushStrength: 0.65,         // Scaling factor for force applied to the particles
  }
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

// --- Blob (Smoke puff) Type --------------------------------------------------
interface Blob {
  px: number;          // X position in cloud texture pixels
  py: number;          // Y position in cloud texture pixels
  vx: number;          // X velocity (pixels/sec)
  vy: number;          // Y velocity (pixels/sec)
  maxRadius: number;   // Maximum radius in pixels
  aspectRatio: number; // Horizontal/Vertical stretch ratio
  roughness: number;   // Boundary edge deformation intensity
  lobes: number;       // Number of cloud-bump features on the edge
  rollSpeed: number;   // Churn rotation speed (radians/sec)
  growthExp: number;   // Exponent controlling the scaling speed
  seed: number;        // Random rotational starting phase
  life: number;        // Lifetime remaining (seconds)
  maxLife: number;     // Starting lifetime (seconds)
}

// --- Disruption Trail Particle Type -----------------------------------------
interface DisruptionParticle {
  cx: number;          // Grid column
  cy: number;          // Grid row
  vx: number;          // Column velocity
  vy: number;          // Row velocity
  radius: number;      // Effect radius (grid cells)
  intensity: number;   // Darkening factor
  life: number;        // Life remaining
  maxLife: number;     // Initial life
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
    let blobGridCache: Float32Array | null = null;
    let disruptionGridCache: Float32Array | null = null;
    let wasIntro = true; // Fixes fractional offset bug

    let lastPW = 0, lastPH = 0, lastDpr = 0;
    let startTime = performance.now();
    let lastPhysicsTime = performance.now();
    let lastRenderTime = performance.now();

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

    // -- Pointer & Physics State ----------------------------------------------
    const mouse = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, active: false, hasMoved: false };
    const disruptions: DisruptionParticle[] = [];

    const handlePointerMove = (e: PointerEvent) => {
      if (!cvs) return;
      const rect = cvs.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Establish starting points on initial interaction to prevent sudden velocity jumps
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

    // Global event listeners to track movement across absolute overlay panels
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerMove);
    window.addEventListener("pointerup", handlePointerLeave);
    window.addEventListener("pointerleave", handlePointerLeave);

    // -- Dynamic State --------------------------------------------------------
    const gusts: Gust[] = [];
    const blobs: Blob[] = [];
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

    function updateBlobs(dt: number, t: number, cols: number, isIntro: boolean) {
      const safeW = currentW || 1;
      const safeH = currentH || 1;

      // Update active particles
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i];
        b.life -= dt;
        if (b.life <= 0) {
          blobs.splice(i, 1);
          continue;
        }

        // Apply a gentle horizontal air-resistance (pulls them toward background drift velocity)
        b.vx += (CONFIG.blobAmbientWind - b.vx) * dt * 1.5;

        // Apply horizontal wind pushes from active crossing gusts
        for (const g of gusts) {
          const age = t - g.born;
          if (age < 0 || age > g.life) continue;

          const center = g.center + g.speed * age;
          const halfW = g.halfWidthFrac * cols;

          // Project blob position to grid columns
          const blobCol = (b.px / imgW) * cols;
          const dist = Math.abs(blobCol - center);

          if (dist < halfW) {
            // Push intensity decays linearly from center of the gust
            const strength = (1 - dist / halfW) * g.boost * CONFIG.blobWindPush;
            const windDir = g.speed > 0 ? 1 : -1;

            // Apply a controlled momentum impulse sideways
            b.vx += windDir * strength * 120 * dt;
            // Introduce a subtle updraft lifting
            b.vy -= strength * 10 * dt;
          }
        }

        // Physical wind push from the active cursor (interactable immediately)
        if (CONFIG.cursorDisruptor.enabled && mouse.active) {
          const mImgX = (mouse.x / safeW) * imgW;
          const mImgY = (mouse.y / safeH) * imgH;
          const mSpeed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

          if (mSpeed > CONFIG.cursorDisruptor.minSpeedToSpawn) {
            const pushRadius = CONFIG.cursorDisruptor.pushRadius;
            const pushStrength = CONFIG.cursorDisruptor.pushStrength;

            const dx = b.px - mImgX;
            const dy = b.py - mImgY;
            const distSq = dx * dx + dy * dy;
            const rSq = pushRadius * pushRadius;

            if (distSq < rSq && distSq > 0.1) {
              const dist = Math.sqrt(distSq);
              const force = (1.0 - dist / pushRadius) * pushStrength;
              const dirX = dx / dist;
              const dirY = dy / dist;

              const mNormX = mouse.vx / mSpeed;
              const mNormY = mouse.vy / mSpeed;

              // Combined radial blast outward + cursor translation velocity
              b.vx += (dirX * 0.35 + mNormX * 0.65) * force * 140 * dt;
              b.vy += (dirY * 0.35 + mNormY * 0.65) * force * 140 * dt;
            }
          }
        }

        // Apply velocities in image pixel space
        b.px += b.vx * dt;
        b.py += b.vy * dt;

        // Apply tiny idle micro-turbulence
        b.vx += (rng() - 0.5) * 18 * dt;
        b.vy += (rng() - 0.5) * 10 * dt;
      }

      // Spawn new particles
      if (imgData && imgW > 0 && imgH > 0 && blobs.length < CONFIG.blobCount) {
        if (rng() < dt * CONFIG.blobSpawnChance * 45) {
          const px = Math.floor(rng() * imgW);
          
          let pyTop = -1;
          let pyBottom = -1;

          // Find the top boundary of the cloud at this column
          for (let y = 0; y < imgH; y++) {
            const idx = (y * imgW + px) * 4;
            if (imgData[idx + 3] > 130) {
              pyTop = y;
              break;
            }
          }

          // Find the bottom boundary of the cloud at this column
          for (let y = imgH - 1; y >= 0; y--) {
            const idx = (y * imgW + px) * 4;
            if (imgData[idx + 3] > 130) {
              pyBottom = y;
              break;
            }
          }

          // If we found a valid cloud column slice
          if (pyTop !== -1 && pyBottom !== -1) {
            const cloudHeight = pyBottom - pyTop;
            
            // Spawn inside the cloud, but biased toward the top-half (60% to 90% of the way up)
            const fractionUp = 0.6 + rng() * 0.3; 
            const py = Math.floor(pyBottom - (cloudHeight * fractionUp));

            const maxLife = CONFIG.blobLife[0] + rng() * (CONFIG.blobLife[1] - CONFIG.blobLife[0]);
            const vx = CONFIG.blobAmbientWind + (rng() - 0.5) * 20; // Starts close to base ambient speed
            const vy = CONFIG.blobSpeedY[0] + rng() * (CONFIG.blobSpeedY[1] - CONFIG.blobSpeedY[0]);
            const maxRadius = CONFIG.blobRadius[0] + rng() * (CONFIG.blobRadius[1] - CONFIG.blobRadius[0]);

            // Unique geometry profiles
            const aspectRatio = 0.6 + rng() * 0.8;      // Elongation stretch [0.6 .. 1.4]
            const roughness = 0.1 + rng() * 0.3;        // Edge complexity [10% .. 40%]
            const lobes = 3 + Math.floor(rng() * 4);    // 3 to 6 fluffy lobes
            const rollSpeed = (rng() - 0.5) * 4.0;      // Rotation churn velocity
            const growthExp = 0.5 + rng() * 1.5;        // Unique scale curve
            const seed = rng() * Math.PI * 2;

            blobs.push({
              px, py, vx, vy, maxRadius, aspectRatio, roughness, lobes, rollSpeed, growthExp, seed,
              life: maxLife, maxLife
            });
          }
        }
      }
    }

    function updateDisruptions(dt: number, cols: number, rows: number) {
      const safeW = currentW || 1;
      const safeH = currentH || 1;

      // Update existing trail particles
      for (let i = disruptions.length - 1; i >= 0; i--) {
        const d = disruptions[i];
        d.life -= dt;
        if (d.life <= 0) {
          disruptions.splice(i, 1);
          continue;
        }
        d.cx += d.vx * dt;
        d.cy += d.vy * dt;
        d.vx *= Math.exp(-dt * 3.0); // momentum air resistance
        d.vy *= Math.exp(-dt * 3.0);
      }

      // Decouple input from frame rate: compute reliable velocity over regular 'dt'
      if (mouse.active && mouse.hasMoved) {
        const dx = mouse.x - mouse.px;
        const dy = mouse.y - mouse.py;
        mouse.vx = dx / dt;
        mouse.vy = dy / dt;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.hasMoved = false; // Reset flag for next check frame
      } else {
        const damp = Math.exp(-dt * 5);
        mouse.vx *= damp;
        mouse.vy *= damp;
      }

      // Generate new trails from active cursor sweeps (interactable immediately)
      if (CONFIG.cursorDisruptor.enabled && mouse.active) {
        const mSpeed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
        if (mSpeed > CONFIG.cursorDisruptor.minSpeedToSpawn) {
          const normSpeed = Math.min(1.0, mSpeed / CONFIG.cursorDisruptor.maxSpeedReference);
          
          // Apply an exponential curve to make speed transitions feel more dynamic
          const speedCurve = Math.pow(normSpeed, 1.2);
          const mCol = (mouse.x / safeW) * cols;
          const mRow = (mouse.y / safeH) * rows;

          disruptions.push({
            cx: mCol,
            cy: mRow,
            vx: (mouse.vx / safeW) * cols * CONFIG.cursorDisruptor.trailFling,
            vy: (mouse.vy / safeH) * rows * CONFIG.cursorDisruptor.trailFling,
            // Radius scales dynamically: fast cursor speeds generate substantially wider disruption bands
            radius: CONFIG.cursorDisruptor.minRadius + speedCurve * (CONFIG.cursorDisruptor.maxRadius - CONFIG.cursorDisruptor.minRadius),
            intensity: speedCurve * CONFIG.cursorDisruptor.maxIntensity,
            life: CONFIG.cursorDisruptor.particleLife,
            maxLife: CONFIG.cursorDisruptor.particleLife,
          });
        }
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
        const mt1 = g.wobbleFreq, mt2 = g.wobbleFreq * 2.3, mt3 = g.wobbleFreq * 0.5;

        for (let row = 0; row < rows; row++) {
          const rowFrac   = row / Math.max(1, rows - 1);
          const tiltShift = g.tilt * (rowFrac - 0.5) * rows;
          const rfPi          = rowFrac * Math.PI;
          const sin2_unscaled = Math.sin(rfPi * mt2 + tS2);
          const sin1_r        = Math.sin(rfPi * mt1 + tS1);
          const sin2_r        = sin2_unscaled * 0.45;
          const sin3_r        = Math.sin(rfPi * mt3 + tS3) * 0.25;
          const rowCenter     = center + tiltShift + (sin1_r + sin2_r + sin3_r) * wobbleScale;
          const cos1_r = Math.cos(rfPi * mt1 + tS1);
          const cos2_r = Math.cos(rfPi * mt2 + tS2);
          const cos3_r = Math.cos(rfPi * mt3 + tS3);

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

    // --- Dedicated Render Phase (Invoked only at target CONFIG.fps) ----------
    function render(now: number, cols: number, rows: number, isIntro: boolean, introOffsetNorm: number) {
      if (!imgData) return;
      const W = currentW, H = currentH;
      if (W === 0 || H === 0) return;

      const t   = (now - startTime) / 1000;
      const dpr = getEffectiveDpr();

      const PW   = Math.round(W * dpr);
      const PH   = Math.round(H * dpr);

      const targetTileSize = Math.ceil(CONFIG.cellSize * dpr);
      if (targetTileSize !== cachedTileSize || dpr !== cachedDpr) {
        cachedDpr = dpr;
        cachedTileSize = targetTileSize;
        glyphAtlas = buildGlyphAtlas(targetTileSize);
      }

      // -- 1. Fast Native Image Coordinates Map ------------------------------
      if (cols !== cachedImageCols || rows !== cachedImageRows || isIntro || wasIntro) {
        if (pxCols.length < cols) pxCols = new Int32Array(cols);
        if (pxRows.length < rows) pxRows = new Int32Array(rows);
        
        for (let c = 0; c < cols; c++) {
          pxCols[c] = Math.min(imgW - 1, Math.floor(((c + 0.5) / cols) * imgW));
        }
        for (let r = 0; r < rows; r++) {
          const normY = (r + 0.5) / rows - introOffsetNorm;
          if (normY < 0 || normY >= 1) {
            pxRows[r] = -1; // Out of bounds transparency
          } else {
            pxRows[r] = Math.min(imgH - 1, Math.floor(normY * imgH));
          }
        }
        
        cachedImageCols = cols;
        cachedImageRows = rows;
        wasIntro = isIntro;
      }

      // -- 2. Dynamic Smoke Blobs --------------------------------------------
      let blobAlphaGrid: Float32Array | null = null;
      if (blobs.length > 0) {
        const reqSize = rows * cols;
        if (!blobGridCache || blobGridCache.length < reqSize) {
          blobGridCache = new Float32Array(reqSize);
        }
        blobAlphaGrid = blobGridCache;
        blobAlphaGrid.fill(0);

        for (const b of blobs) {
          const pct = b.life / b.maxLife;
          // Soft fade-in followed by a slow puff-out
          const opacity = pct > 0.8 ? (1.0 - pct) / 0.2 : pct / 0.8;
          const alphaClamp = Math.min(1.0, Math.max(0.0, opacity)) * 0.75;

          // Expand the puff based on its unique growth exponent
          const scaleProg = Math.pow(1.0 - pct, b.growthExp);
          const currentRadius = b.maxRadius * (0.45 + 0.75 * scaleProg);

          // Project center to grid space, synchronizing with the intro offsets
          const g_cx = (b.px / imgW) * cols;
          const g_cy = ((b.py / imgH) + introOffsetNorm) * rows;

          const g_rx = (currentRadius / imgW) * cols;
          const g_ry = (currentRadius / imgH) * rows;

          // Apply unique aspect ratio stretch
          const radiusX = g_rx * b.aspectRatio;
          const radiusY = g_ry / b.aspectRatio;

          // Pad the bounding box to prevent clipping edge roughness
          const maxRoughnessExtent = 1.0 + b.roughness;
          const cMin = Math.max(0, Math.floor(g_cx - radiusX * maxRoughnessExtent));
          const cMax = Math.min(cols - 1, Math.ceil(g_cx + radiusX * maxRoughnessExtent));
          const rMin = Math.max(0, Math.floor(g_cy - radiusY * maxRoughnessExtent));
          const rMax = Math.min(rows - 1, Math.ceil(g_cy + radiusY * maxRoughnessExtent));

          // Draw the deformed, churning puff onto the grid map
          for (let r = rMin; r <= rMax; r++) {
            const rowBase = r * cols;
            const dy = (r - g_cy) / radiusY;

            for (let c = cMin; c <= cMax; c++) {
              const dx = (c - g_cx) / radiusX;

              // Deform the perimeter circle via polar angles + spinning roll
              const angle = Math.atan2(dy, dx);
              const rotationOffset = t * b.rollSpeed + b.seed;
              
              // Fractal-like multi-frequency wave summing to build fluffy smoke contours
              const wave1 = Math.sin(angle * b.lobes + rotationOffset);
              const wave2 = Math.cos(angle * (b.lobes * 1.9) - rotationOffset * 1.4) * 0.4;
              const wave3 = Math.sin(angle * 0.8 + rotationOffset * 0.3) * 0.5; // asymmetric wobble
              
              // Prevent dividing by zero or negative radius values
              const radiusPerturbation = Math.max(0.2, 1.0 + (wave1 + wave2 + wave3) * b.roughness * 0.5);
              
              const distSq = (dx * dx + dy * dy) / (radiusPerturbation * radiusPerturbation);
              if (distSq >= 1.0) continue;

              const val = (1.0 - distSq) * alphaClamp;
              const idx = rowBase + c;
              if (val > blobAlphaGrid[idx]) {
                blobAlphaGrid[idx] = val;
              }
            }
          }
        }
      }

      // -- 3. Pointer Disruption Grid (Bipolar Pressure Wave) -----------------
      let disruptionGrid: Float32Array | null = null;
      if (disruptions.length > 0) {
        const reqSize = rows * cols;
        if (!disruptionGridCache || disruptionGridCache.length < reqSize) {
          disruptionGridCache = new Float32Array(reqSize);
        }
        disruptionGrid = disruptionGridCache;
        disruptionGrid.fill(0); // 0 means neutral air pressure

        for (const d of disruptions) {
          const pct = d.life / d.maxLife; // 1.0 (spawn) to 0.0 (death)
          const currentIntensity = d.intensity * pct;

          // Calculate an expanding dynamic radius to simulate dispersal dispersion
          const expansion = 1.0 + (1.0 - pct) * (CONFIG.cursorDisruptor.expansionFactor - 1.0);
          const radius = d.radius * expansion;

          // Normalize the velocity direction vector (ux, uy)
          const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
          const ux = speed > 0.001 ? d.vx / speed : 0;
          const uy = speed > 0.001 ? d.vy / speed : 0;

          const cMin = Math.max(0, Math.floor(d.cx - radius));
          const cMax = Math.min(cols - 1, Math.ceil(d.cx + radius));
          const rMin = Math.max(0, Math.floor(d.cy - radius));
          const rMax = Math.min(rows - 1, Math.ceil(d.cy + radius));

          for (let r = rMin; r <= rMax; r++) {
            const rowBase = r * cols;
            const dy = r - d.cy;

            for (let c = cMin; c <= cMax; c++) {
              const dx = c - d.cx;
              const distSq = dx * dx + dy * dy;
              const rSq = radius * radius;
              if (distSq >= rSq) continue;

              // Quadratic falloff profile towards edge of disruption circle
              const distRatio = Math.sqrt(distSq) / radius;
              const falloff = 1 - distRatio * distRatio;

              // Project coordinate offset onto the velocity direction
              // positive projection = front wave (compression / thickening)
              // negative projection = rear wake (rarefaction / thinning)
              const proj = dx * ux + dy * uy;
              const projNorm = radius > 0 ? proj / radius : 0;

              const pressureVal = projNorm * falloff * currentIntensity;
              const idx = rowBase + c;
              
              // Accumulate signed pressure offsets (bounded between -1.0 and 1.0)
              disruptionGrid[idx] = Math.min(1.0, Math.max(-1.0, disruptionGrid[idx] + pressureVal));
            }
          }
        }
      }

      // -- 4. Gust Map -------------------------------------------------------
      let gustMap: Float32Array | null = null;
      if (!isIntro) {
        gustMap = buildGustMap(rows, cols, t);
      }

      // -- 5. Bresenham Grid --------------------------------------------------
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

      // -- 6. Output buffer --------------------------------------------------
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

      // -- 7. Main loop ------------------------------------------------------
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
          
          // Image mask lookup
          const pYMask = pxRows[srcRow];
          let imgMaskAlpha = 0;
          if (pYMask >= 0) {
            imgMaskAlpha = imgData[(pYMask * imgW + pxCols[col]) * 4 + 3];
          }

          // Fetch the dynamic deformed blob values at coordinates
          const blobVal = blobAlphaGrid ? blobAlphaGrid[srcRow * cols + col] : 0;
          const blobAlpha255 = Math.floor(blobVal * 255);

          // Calculate interactive wind trail disruption pressure factor
          const disruption = disruptionGrid ? disruptionGrid[srcRow * cols + col] : 0;
          // disruption ranges from -1.0 (rarefaction/darken) to +1.0 (compression/brighten)
          // Map this to a multiplication scaling factor clamped between 0.0 and 2.0
          const disruptionFactor = Math.min(2.0, Math.max(0.0, 1.0 + disruption));

          // Combined mask values (scaled by local cursor disruption)
          let combinedMaskAlpha = Math.max(imgMaskAlpha, blobAlpha255);
          if (combinedMaskAlpha === 0) continue;
          combinedMaskAlpha = Math.min(255, Math.floor(combinedMaskAlpha * disruptionFactor));
          if (combinedMaskAlpha === 0) continue;

          // Combined intensity thresholds
          const pYRaw = pxRows[row];
          let imgAlpha = 0;
          if (pYRaw >= 0) {
            imgAlpha = imgData[(pYRaw * imgW + pxCols[col]) * 4 + 3] / 255;
          }

          let combinedAlpha = Math.max(imgAlpha, blobVal);
          combinedAlpha = Math.min(1.0, combinedAlpha * disruptionFactor);
          if (combinedAlpha < threshold) continue;

          const bPhase = NOISE[ni], bSpeed = NOISE[ni + 1];
          const wave   = Math.sin(t * s * bSpeed * 1.3 + bPhase) * wAmp + Math.sin(t * s * bSpeed * 0.6 + bPhase * 1.9) * wAmp * 0.4;
          
          const gVal = gustMap ? gustMap[rowBase + col] : 0;
          const modulated = Math.min(1, Math.max(0.05, (combinedAlpha - threshold) / ceilMinThr + wave + gVal));
          const charIdx  = Math.floor(modulated * (CHARS.length - 1));
          const alphaIdx = Math.min(ALPHA_STEPS - 1, Math.floor(Math.min(1, combinedAlpha / thresholdD2) * ALPHA_STEPS));
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
              
              buf[dstRowOff + tx * 4 + 3] = (glyphA * combinedMaskAlpha) >> 8;
            }
          }
        }
      }

      // -- 8. Flush ----------------------------------------------------------
      offOutCtx.putImageData(outImageData!, 0, 0);
      if (cvs.width !== PW || cvs.height !== PH) {
        cvs.width  = PW;
        cvs.height = PH;
      }
      
      ctx.clearRect(0, 0, PW, PH); 
      ctx.drawImage(offOut, 0, 0);
    }

    // -- Dual-Rate Main Loop (Physics at 60Hz, Render at CONFIG.fps) ----------
    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);

      const t = (now - startTime) / 1000;
      let dt = (now - lastPhysicsTime) / 1000;
      if (dt < 0) dt = 0;
      if (dt > 0.1) dt = 0.1;
      lastPhysicsTime = now;

      const W = currentW, H = currentH;
      if (W === 0 || H === 0) return;

      const isIntro = t < CONFIG.introDuration;

      // Current cell size depending on intro progress
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

      // 1. Run Physics & Input Tracking at unthrottled 60fps (Active instantly)
      updateDisruptions(dt, cols, rows);
      updateBlobs(dt, t, cols, isIntro);
      if (!isIntro) {
        updateGusts(t, cols);
      }

      // 2. Throttle visual canvas drawing (render) strictly to CONFIG.fps (10fps)
      // (Intro sequence is kept unthrottled for smooth scaling)
      const interval = 1000 / CONFIG.fps;
      if (isIntro || (now - lastRenderTime >= interval)) {
        if (!isIntro) {
          lastRenderTime = now - ((now - lastRenderTime) % interval);
        } else {
          lastRenderTime = now;
        }
        render(now, cols, rows, isIntro, introOffsetNorm);
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
      lastPhysicsTime = startTime;
      lastRenderTime = startTime;
      rafRef.current = requestAnimationFrame(loop);
    };

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerLeave);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
    />
  );
}