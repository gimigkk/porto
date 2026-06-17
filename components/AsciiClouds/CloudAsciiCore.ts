/**
 * CloudAsciiCore.ts
 * 
 * Centralized core configuration, TypeScript definitions, and utility functions 
 * for the ASCII cloud simulation. Merged for simplicity.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
export const CONFIG = {
  cellSize: 8,

  // -- Intro Sequence --
  introStartSize: 200,
  introDuration: 2.0,  // Sped up from 3.5s to 2.0s for snappier entry
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
  gustMinSpeed: 10,
  gustMaxSpeed: 20,
  gustMinWidth: 0.09,
  gustMaxWidth: 0.12,

  // -- Gust angle --
  gustMinTilt: 0.15,
  gustMaxTilt: 0.45,

  // -- Blobs (Smoke puffs) --
  blobCount: 45,             // Increased from 30 to make it denser
  blobSpawnChance: 0.5,      // Faster spawn rate
  blobLife: [5.5, 9.0],      // Lifetime in seconds
  blobRadius: [12, 92],      // Refined puff size for elegant smoke contours
  blobSpeedY: [-65, -20],    // Graceful, slower vertical speed (negative = upwards)
  blobAmbientWind: 12.0,     // Gentle background horizontal breeze
  blobWindPush: 10.0,        // Strength of gust wind blowing particles sideways
  blobStrength: 0.85,        // Increased back to 0.85 because Gaussian falloff made them too faint

  bloom: {
    enabled: true,
    topGlyphs: 3,        // The top N brightest glyphs receive the bloom effect
    blurSize: 10.0,       // CSS blur radius in pixels (scaled by DPR internally)
    opacity: 1,       // Opacity of the bloom overlay
  },

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

    // -- Tune limits below to adjust responsiveness vs. constraints --
    maxWarpDisplacement: 14.0,  // Max grid cells allowed to warp. Lower = stiffer, Higher = looser warp.
    maxBlobSpeed: 320.0,        // Max drift speed of smoke puffs to keep them elegant.
  }
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface Gust {
  id: number;
  center: number;
  speed: number;
  halfWidthFrac: number;
  boost: number;
  wobble: number;
  wobbleFreq: number;
  wobblePhase: number;
  tilt: number;
  yCenter: number; // Vertical center of the gust (0.0 to 1.0)
  yHeight: number; // Vertical thickness/span of the gust (0.0 to 1.0)
  edgeNoise: Float32Array;
  born: number;
  fadeIn: number;
  fadeOut: number;
  life: number;
}

export interface Blob {
  px: number;          // X position in cloud texture pixels
  py: number;          // Y position in cloud texture pixels
  vx: number;          // X velocity (pixels/sec)
  vy: number;          // Y velocity (pixels/sec)
  maxRadius: number;   // Maximum radius in pixels
  aspectRatio: number; // Horizontal/Vertical stretch ratio
  roughness: number;   // Noise distortion intensity
  growthExp: number;   // Exponent controlling the scaling speed
  seed: number;        // Random noise offset
  life: number;        // Lifetime remaining (seconds)
  maxLife: number;     // Starting lifetime (seconds)
  generation: number;  // Splitting generation (0 = parent, 1 = child)
}

export interface DisruptionParticle {
  cx: number;          // Grid column
  cy: number;          // Grid row
  vx: number;          // Column velocity
  vy: number;          // Row velocity
  radius: number;      // Effect radius (grid cells)
  intensity: number;   // Darkening factor
  life: number;        // Life remaining
  maxLife: number;     // Initial life
}

export interface CloudState {
  gusts: Gust[];
  blobs: Blob[];
  disruptions: DisruptionParticle[];
  lastSpawnTime: number;
}

export interface MouseState {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  active: boolean;
  hasMoved: boolean;
}

// ============================================================================
// UTILITIES
// ============================================================================
// export const CHARS = ".:/%#G@"; <- lama
export const CHARS = ".:-=+*#%G";


export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const NOISE_W = 300;
export const NOISE_H = 150;
export const rng = mulberry32(0xc0ffee42);
export const NOISE = new Float32Array(NOISE_W * NOISE_H * 5);
for (let i = 0; i < NOISE_W * NOISE_H; i++) {
  NOISE[i * 5 + 0] = rng() * Math.PI * 2;
  NOISE[i * 5 + 1] = 0.6 + rng() * 0.8;
  NOISE[i * 5 + 2] = rng() * Math.PI * 2;
  NOISE[i * 5 + 3] = rng() > 0.5 ? 1 : -1;
  NOISE[i * 5 + 4] = 0.4 + rng() * 0.6;
}

export const ALPHA_STEPS = 16;

export function buildGlyphAtlas(tileSize: number): Uint8Array[][] {
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
      const raw = gx.getImageData(0, 0, tileSize, tileSize).data;
      const alpha = new Uint8Array(tileSize * tileSize);
      for (let i = 0; i < alpha.length; i++) alpha[i] = raw[i * 4 + 3];
      return alpha;
    })
  );
}

export const gustRng = mulberry32(0xdeadbeef);
let gustIdCounter = 0;

export function spawnGust(t: number, cols: number): Gust {
  const r = () => gustRng();
  const leftToRight = r() > 0.5;
  const speed = (CONFIG.gustMinSpeed + r() * (CONFIG.gustMaxSpeed - CONFIG.gustMinSpeed)) * (leftToRight ? 1 : -1);
  const halfWidthFrac = CONFIG.gustMinWidth + r() * (CONFIG.gustMaxWidth - CONFIG.gustMinWidth);
  const halfW = halfWidthFrac * cols;
  const spawnInMiddle = r() < 0.3;
  const startCenter = spawnInMiddle
    ? halfW + r() * (cols - 2 * halfW)
    : leftToRight ? -halfW : cols + halfW;
  const life = (cols + 2 * halfW) / Math.abs(speed) + r() * 1.5;
  const fadeIn = 0.4 + r() * 0.8;
  const fadeOut = 0.4 + r() * 0.8;
  const tiltSign = r() > 0.5 ? 1 : -1;
  const tilt = tiltSign * (CONFIG.gustMinTilt + r() * (CONFIG.gustMaxTilt - CONFIG.gustMinTilt));
  const yCenter = 0.2 + r() * 0.6; // Spawn mostly in the central 60% of the screen
  const yHeight = 0.3 + r() * 0.4; // Height spans 30% to 70% of the screen

  const EDGE_SAMPLES = 32;
  const ctrlPts = new Float32Array(EDGE_SAMPLES + 1);
  for (let i = 0; i <= EDGE_SAMPLES; i++) ctrlPts[i] = r() * 2 - 1;
  const edgeNoise = new Float32Array(cols);
  for (let c = 0; c < cols; c++) {
    const frac = (c / Math.max(1, cols - 1)) * EDGE_SAMPLES;
    const lo = Math.floor(frac);
    const hi = Math.min(EDGE_SAMPLES, lo + 1);
    const t0 = frac - lo;
    const sm = t0 * t0 * (3 - 2 * t0);
    edgeNoise[c] = ctrlPts[lo] * (1 - sm) + ctrlPts[hi] * sm;
  }

  return {
    id: ++gustIdCounter, center: startCenter, speed, halfWidthFrac, tilt,
    yCenter, yHeight,
    boost: 0.08 + r() * 0.14, wobble: 0.05 + r() * 0.25,
    wobbleFreq: 1.5 + r() * 3.0, wobblePhase: r() * Math.PI * 2,
    edgeNoise, born: t, fadeIn, fadeOut, life
  };
}
