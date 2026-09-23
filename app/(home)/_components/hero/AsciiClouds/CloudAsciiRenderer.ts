/**
 * CloudAsciiRenderer.ts
 * 
 * The core object-oriented rendering engine.
 * The AsciiRenderer class handles HTMLCanvasElement manipulation, ResizeObserver scaling,
 * off-screen buffer management, and complex pixel-to-ASCII rasterization logic.
 */
import { CONFIG, CloudState, CHARS, ALPHA_STEPS, buildGlyphAtlas, NOISE, NOISE_H, NOISE_W } from "./CloudAsciiCore";

const ALPHA_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  ALPHA_LUT[i] = i / 255;
}

export class AsciiRenderer {
  cvs: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  currentW = 0;
  currentH = 0;
  ro: ResizeObserver;

  imgData: Uint8ClampedArray | null = null;
  imgAlphaData: Uint8Array | null = null;
  imgW = 0;
  imgH = 0;

  cachedDpr = 0;
  cachedTileSize = 0;
  glyphAtlas: Uint8Array[][] = [];

  offOut: HTMLCanvasElement;
  offOutCtx: CanvasRenderingContext2D;
  outImageData: ImageData | null = null;
  outBuf: Uint8ClampedArray | null = null;
  outBuf32: Uint32Array | null = null;

  bloomOffOut: HTMLCanvasElement;
  bloomOffOutCtx: CanvasRenderingContext2D;
  bloomImageData: ImageData | null = null;
  bloomBuf: Uint8ClampedArray | null = null;
  bloomBuf32: Uint32Array | null = null;

  pxCols = new Int32Array(0);
  pxRows = new Int32Array(0);

  cachedImageCols = 0;
  cachedImageRows = 0;
  cachedGridCols = 0;
  cachedGridRows = 0;
  cachedGridPW = 0;
  cachedGridPH = 0;

  gustRowCache: Float32Array | null = null;
  blobGridCache: Float32Array | null = null;
  disruptionGridCache: Float32Array | null = null;
  noiseDispCache = new Float32Array(NOISE_W * NOISE_H);
  noiseWaveCache = new Float32Array(NOISE_W * NOISE_H);
  wasIntro = true;
  prevHadBloom = false;

  lastPW = 0;
  lastPH = 0;
  lastDpr = 0;

  constructor(cvs: HTMLCanvasElement) {
    this.cvs = cvs;
    this.ctx = cvs.getContext("2d")!;
    
    this.offOut = document.createElement("canvas");
    this.offOutCtx = this.offOut.getContext("2d", { willReadFrequently: true })!;
    
    this.bloomOffOut = document.createElement("canvas");
    this.bloomOffOutCtx = this.bloomOffOut.getContext("2d", { willReadFrequently: true })!;

    this.ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e.contentBoxSize) {
        this.currentW = e.contentBoxSize[0].inlineSize;
        this.currentH = e.contentBoxSize[0].blockSize;
      } else {
        this.currentW = e.contentRect.width;
        this.currentH = e.contentRect.height;
      }
    });
    this.ro.observe(cvs);
    const r = cvs.getBoundingClientRect();
    this.currentW = r.width || cvs.parentElement?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1200);
    this.currentH = r.height || cvs.parentElement?.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 800);
  }

  destroy() {
    this.ro.disconnect();
  }

  setImageData(data: Uint8ClampedArray, w: number, h: number) {
    this.imgData = data;
    this.imgW = w;
    this.imgH = h;
    const len = w * h;
    const alpha = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      alpha[i] = data[i * 4 + 3];
    }
    this.imgAlphaData = alpha;
  }

  setGlyphAtlas(atlas: Uint8Array[][], tileSize: number) {
    this.glyphAtlas = atlas;
    this.cachedTileSize = tileSize;
    this.cachedDpr = this.getEffectiveDpr();
  }

  getEffectiveDpr(): number {
    return Math.min(window.devicePixelRatio || 1, 1.5);
  }

  buildGustMap(state: CloudState, rows: number, cols: number, t: number, maxRows: number, maxCols: number): Float32Array {
    const reqSize = maxRows * maxCols;
    if (!this.gustRowCache || this.gustRowCache.length < reqSize) {
      this.gustRowCache = new Float32Array(reqSize);
    }
    const map = this.gustRowCache;
    map.fill(0, 0, rows * cols);

    for (const g of state.gusts) {
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
        
        // Vertical envelope so gust doesn't span from edge to edge
        const yDist = Math.abs(rowFrac - g.yCenter) / (g.yHeight * 0.5);
        if (yDist >= 1) continue; // Skip rows outside the vertical bounds of this gust
        
        // Smooth falloff vertically
        const yFade = Math.pow(Math.cos(yDist * Math.PI / 2), 2);
        const rowBoostFade = boostFade * yFade;

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
          const cnBase = col * 6;
          const sinCn  = g.cnSinCos[cnBase];
          const cosCn  = g.cnSinCos[cnBase + 1];
          const sinCn2 = g.cnSinCos[cnBase + 2];
          const cosCn2 = g.cnSinCos[cnBase + 3];
          const sinCn3 = g.cnSinCos[cnBase + 4];
          const cosCn3 = g.cnSinCos[cnBase + 5];
          const no1 = (sin1_r        * cosCn  + cos1_r * sinCn);
          const no2 = (sin2_unscaled * cosCn2 + cos2_r * sinCn2) * 0.45;
          const no3 = (sin3_r        * cosCn3 + cos3_r * sinCn3) * 0.25;
          const offsetFromCenter = col - (center + tiltShift + (no1 + no2 + no3) * wobbleScale);
          const dist = Math.abs(offsetFromCenter);
          if (dist < halfW) {
            const u = offsetFromCenter * halfWInv; // -1 to 1
            const direction = g.speed > 0 ? 1 : -1;
            const directedU = u * direction; // -1 (back of wave) to 1 (front of wave)

            // Perturb the wave profile with existing organic noise so it's not a perfect consistent stripe
            const noisyU = directedU + (no1 * 0.4 + no2 * 0.2);
            const clampedU = Math.max(-1, Math.min(1, noisyU));

            // A pure sine wave provides a bright leading peak and dark trailing trough
            const baseWave = Math.sin(clampedU * Math.PI);
            
            // Sharpen the peaks
            let sharpWave = Math.sign(baseWave) * Math.pow(Math.abs(baseWave), 1.5);
            
            // Reduce the darkening effect so it's not too harsh
            if (sharpWave < 0) {
              sharpWave *= 0.4;
            }
            
            // Multiply by 1.5 to compensate for the sharper peak so it remains highly visible
            map[rowBase + col] += sharpWave * rowBoostFade * 1.5;
          }
        }
      }
    }
    return map;
  }

  render(state: CloudState, now: number, startTime: number, isIntro: boolean, introOffsetNorm: number, cols: number, rows: number) {
    if (!this.imgData) return;
    const W = this.currentW, H = this.currentH;
    if (W === 0 || H === 0) return;

    const t   = (now - startTime) / 1000;
    const dpr = this.getEffectiveDpr();

    const PW   = Math.round(W * dpr);
    const PH   = Math.round(H * dpr);

    const activeCellSize = W < 768 ? 5 : CONFIG.cellSize;
    const targetTileSize = Math.ceil(activeCellSize * dpr);
    if (this.glyphAtlas.length === 0 || (targetTileSize !== this.cachedTileSize || dpr !== this.cachedDpr)) {
      // Only build if not pre-loaded
      this.cachedDpr = dpr;
      this.cachedTileSize = targetTileSize;
      this.glyphAtlas = buildGlyphAtlas(targetTileSize);
    }

    if (cols !== this.cachedImageCols || rows !== this.cachedImageRows || isIntro || this.wasIntro) {
      const activeCellSizeMax = W < 768 ? 5 : CONFIG.cellSize;
      const maxCols = Math.max(1, Math.floor(W / activeCellSizeMax));
      const maxRows = Math.max(1, Math.floor(H / activeCellSizeMax));

      if (this.pxCols.length < maxCols) this.pxCols = new Int32Array(maxCols);
      if (this.pxRows.length < maxRows) this.pxRows = new Int32Array(maxRows);
      
      const displayAR = W / H;
      const isMobile = displayAR < 1;

      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols;
        this.pxCols[c] = Math.max(0, Math.min(this.imgW - 1, Math.floor(u * this.imgW)));
      }
      for (let r = 0; r < rows; r++) {
        let normY = (r + 0.5) / rows;
        if (isMobile) {
          normY = (normY - (1 - displayAR)) / displayAR;
        }
        normY -= introOffsetNorm;
        
        if (normY < 0 || normY >= 1) {
          this.pxRows[r] = -1;
        } else {
          this.pxRows[r] = Math.min(this.imgH - 1, Math.floor(normY * this.imgH));
        }
      }
      
      this.cachedImageCols = cols;
      this.cachedImageRows = rows;
      this.wasIntro = isIntro;
    }

    const activeCellSizeMax = W < 768 ? 5 : CONFIG.cellSize;
    const maxCols = Math.max(1, Math.floor(W / activeCellSizeMax));
    const maxRows = Math.max(1, Math.floor(H / activeCellSizeMax));

    let blobAlphaGrid: Float32Array | null = null;
    if (state.blobs.length > 0) {
      const reqSize = maxRows * maxCols;
      if (!this.blobGridCache || this.blobGridCache.length < reqSize) {
        this.blobGridCache = new Float32Array(reqSize);
      }
      blobAlphaGrid = this.blobGridCache;
      blobAlphaGrid.fill(0, 0, rows * cols);

      const displayAR = W / H;
      const isMobile = displayAR < 1;

      for (const b of state.blobs) {
        const pct = b.life / b.maxLife;
        // Slower fade-in (first 30% of life) and fade-out
        const opacity = pct > 0.7 ? (1.0 - pct) / 0.3 : pct / 0.7;
        const alphaClamp = Math.min(1.0, Math.max(0.0, opacity)) * CONFIG.blobStrength;

        const scaleProg = Math.pow(1.0 - pct, b.growthExp);
        const currentRadius = b.maxRadius * (0.45 + 0.75 * scaleProg);

        // Map blob image coords directly to grid coords
        const g_cx = (b.px / this.imgW) * cols;
        
        let b_normY = (b.py / this.imgH);
        let b_radiusY = (currentRadius / this.imgH);
        
        if (isMobile) {
          b_normY = b_normY * displayAR + (1 - displayAR);
          b_radiusY *= displayAR;
        }
        
        const g_cy = (b_normY + introOffsetNorm) * rows;

        const g_rx = (currentRadius / this.imgW) * cols;
        const g_ry = b_radiusY * rows;

        const radiusX = g_rx * b.aspectRatio;
        const radiusY = g_ry / b.aspectRatio;

        const maxRoughnessExtent = 1.0 + b.roughness;
        const cMin = Math.max(0, Math.floor(g_cx - radiusX * maxRoughnessExtent));
        const cMax = Math.min(cols - 1, Math.ceil(g_cx + radiusX * maxRoughnessExtent));
        const rMin = Math.max(0, Math.floor(g_cy - radiusY * maxRoughnessExtent));
        const rMax = Math.min(rows - 1, Math.ceil(g_cy + radiusY * maxRoughnessExtent));

        for (let r = rMin; r <= rMax; r++) {
          const rowBase = r * cols;
          const dy = (r - g_cy) / radiusY;
          
          const noisePhase = b.seed + t * 0.15;
          const cos_dy_1 = Math.cos(dy * 1.5 - noisePhase * 0.8);
          const cos_dy_2 = Math.cos(dy * 2.0 + noisePhase);

          for (let c = cMin; c <= cMax; c++) {
            const dx = (c - g_cx) / radiusX;
            
            // Organic noise distortion based on grid coordinates and angle
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.001) continue;

            const noisePhase = b.seed + t * 0.15; // Slowed down from 0.5
            
            // Precalculate trigonometric terms for radial wobble
            const cosP1 = Math.cos(noisePhase * 0.7);
            const sinP1 = Math.sin(noisePhase * 0.7);
            const cosP2 = Math.cos(noisePhase);
            const sinP2 = Math.sin(noisePhase);

            const cosA = dx / dist;
            const sinA = dy / dist;
            const sin2A = 2 * sinA * cosA;
            const cos2A = cosA * cosA - sinA * sinA;

            // Cartesian noise - lower frequencies for slower billowing
            const noise1 = Math.sin(dx * 1.5 + noisePhase) * cos_dy_1;
            const noise2 = Math.sin(dx * 2.5 - noisePhase * 1.2) * cos_dy_2;
            
            // Radial wobble - smoother, avoiding Math.atan2
            const sin_2A_P = sin2A * cosP1 + cos2A * sinP1;
            const cos_A_minus_P = cosA * cosP2 + sinA * sinP2;
            const angleWobble = sin_2A_P * 0.5 + cos_A_minus_P * 0.5;
            
            // Combine them for a much more organic, less oblong shape
            const radiusPerturbation = Math.max(0.2, 1.0 + (noise1 * 0.6 + noise2 * 0.3 + angleWobble * 0.5) * b.roughness * 0.7);
            
            const distSq = (dx * dx + dy * dy) / (radiusPerturbation * radiusPerturbation);
            if (distSq >= 1.0) continue;

            // Soft Gaussian-like falloff for volumetric look
            const falloff = Math.exp(-distSq * 2.5);
            const edgeFade = 1.0 - distSq; // Ensures it goes completely to 0 at the edge
            
            const val = falloff * edgeFade * alphaClamp;
            const idx = rowBase + c;
            
            // Constructive Additive Blending
            blobAlphaGrid[idx] = Math.min(1.0, blobAlphaGrid[idx] + val);
          }
        }
      }
    }

    let disruptionGrid: Float32Array | null = null;
    if (state.disruptions.length > 0) {
      const reqSize = maxRows * maxCols;
      if (!this.disruptionGridCache || this.disruptionGridCache.length < reqSize) {
        this.disruptionGridCache = new Float32Array(reqSize);
      }
      disruptionGrid = this.disruptionGridCache;
      disruptionGrid.fill(0, 0, rows * cols);

      for (const d of state.disruptions) {
        const pct = d.life / d.maxLife;
        const currentIntensity = d.intensity * pct;

        const expansion = 1.0 + (1.0 - pct) * (CONFIG.cursorDisruptor.expansionFactor - 1.0);
        const radius = d.radius * expansion;

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

            const distRatio = Math.sqrt(distSq) / radius;
            const falloff = 1 - distRatio * distRatio;

            const proj = dx * ux + dy * uy;
            const projNorm = radius > 0 ? proj / radius : 0;

            const pressureVal = projNorm * falloff * currentIntensity;
            const idx = rowBase + c;
            
            disruptionGrid[idx] = Math.min(1.0, Math.max(-1.0, disruptionGrid[idx] + pressureVal));
          }
        }
      }
    }

    let gustMap: Float32Array | null = null;
    if (!isIntro && state.gusts.length > 0) {
      gustMap = this.buildGustMap(state, rows, cols, t, maxRows, maxCols);
    }

    const activeTileSize = this.cachedTileSize;
    const gridPW = Math.max(1, (cols * activeTileSize) | 0);
    const gridPH = Math.max(1, (rows * activeTileSize) | 0);

    // Allocate at the active grid size (steady-state post-intro).
    if (gridPW > this.lastPW || gridPH > this.lastPH || dpr !== this.lastDpr) {
      const allocW = Math.max(gridPW, this.lastPW);
      const allocH = Math.max(gridPH, this.lastPH);
      
      this.offOut.width  = allocW;
      this.offOut.height = allocH;
      this.outImageData  = this.offOutCtx.createImageData(allocW, allocH);
      this.outBuf        = this.outImageData.data;
      this.outBuf32      = new Uint32Array(this.outBuf.buffer);
      this.outBuf.fill(255);
      
      this.bloomOffOut.width = allocW;
      this.bloomOffOut.height = allocH;
      this.bloomImageData = this.bloomOffOutCtx.createImageData(allocW, allocH);
      this.bloomBuf = this.bloomImageData.data;
      this.bloomBuf32 = new Uint32Array(this.bloomBuf.buffer);
      this.bloomBuf.fill(255);
      
      this.lastPW = allocW; this.lastPH = allocH; this.lastDpr = dpr;
    }

    if (this.cvs.width !== gridPW || this.cvs.height !== gridPH) {
      this.cvs.width  = gridPW;
      this.cvs.height = gridPH;
    }

    const buf   = this.outBuf!;
    const buf32 = this.outBuf32!;
    const bloomBuf = this.bloomBuf!;
    const bloomBuf32 = this.bloomBuf32!;
    const s     = CONFIG.speed * 0.018;
    const wAmp  = CONFIG.waveDepth * 0.3;
    const dAmp  = CONFIG.displacement * 2;
    const { threshold, ceiling } = CONFIG;
    const thresholdD2 = threshold * 0.5 + 0.05;
    const ceilMinThr  = ceiling - threshold;
    const invCeilMinThr = 1 / ceilMinThr;
    const invThresholdD2 = 1 / thresholdD2;

    // Precompute noise for grid region actually rendered.
    // noiseIdx = (row % NOISE_H)*NOISE_W + (col & 255). rows ≤ NOISE_H, cols ≤ NOISE_W.
    for (let r = 0; r < rows; r++) {
      const rowBase = (r % NOISE_H) * NOISE_W;
      for (let c = 0; c < cols; c++) {
        const i = rowBase + (c & 255);
        const ni = i * 5;
        const bPhase = NOISE[ni], bSpeed = NOISE[ni + 1];
        const dPhase = NOISE[ni + 2], dDir = NOISE[ni + 3], dSpeed = NOISE[ni + 4];
        
        this.noiseDispCache[i] = Math.sin(t * s * dSpeed + dPhase) * dAmp * dDir;
        this.noiseWaveCache[i] = Math.sin(t * s * bSpeed * 1.3 + bPhase) * wAmp + Math.sin(t * s * bSpeed * 0.6 + bPhase * 1.9) * wAmp * 0.4;
      }
    }

    const bufStride = this.lastPW; // allocated width, not grid width
    const activePixelCount = gridPH * bufStride;
    buf32.fill(0x00FFFFFF, 0, activePixelCount);
    if (CONFIG.bloom.enabled) {
      bloomBuf32.fill(0x00FFFFFF, 0, activePixelCount);
    }
    let hasBrightGlyphs = false;

    const numDisruptions = state.disruptions.length;
    let minDCol = 99999, maxDCol = -1, minDRow = 99999, maxDRow = -1;
    if (numDisruptions > 0) {
      for (let i = 0; i < numDisruptions; i++) {
        const d = state.disruptions[i];
        const r = Math.ceil(d.radius) + 1;
        const c0 = Math.max(0, Math.floor(d.cx - r));
        const c1 = Math.min(cols - 1, Math.ceil(d.cx + r));
        const r0 = Math.max(0, Math.floor(d.cy - r));
        const r1 = Math.min(rows - 1, Math.ceil(d.cy + r));
        if (c0 < minDCol) minDCol = c0;
        if (c1 > maxDCol) maxDCol = c1;
        if (r0 < minDRow) minDRow = r0;
        if (r1 > maxDRow) maxDRow = r1;
      }
    }

    const maxWarp = CONFIG.cursorDisruptor.maxWarpDisplacement;
    const charsLenMinus1 = CHARS.length - 1;
    const bloomThresholdIdx = CHARS.length - CONFIG.bloom.topGlyphs;
    const bloomFadeRow = rows * 0.85;
    const bloomFadeHeight = rows * 0.15;
    const rowStride = bufStride * 4;

    for (let row = 0; row < rows; row++) {
      const rowBase = row * cols;
      const noiseRowBase = (row % NOISE_H) * NOISE_W;
      const bloomMask = row < bloomFadeRow ? 1.0 : Math.max(0, 1.0 - ((row - bloomFadeRow) / bloomFadeHeight));
      const rowInDisruption = numDisruptions > 0 && row >= minDRow && row <= maxDRow;

      for (let col = 0; col < cols; col++) {
        let dispCol = 0;
        let dispRow = 0;

        if (rowInDisruption && col >= minDCol && col <= maxDCol) {
          for (let i = 0; i < numDisruptions; i++) {
            const d = state.disruptions[i];
            const dx = col - d.cx;
            const dy = row - d.cy;
            const distSq = dx * dx + dy * dy;
            const rSq = d.radius * d.radius;
            if (distSq < rSq) {
              const dist = Math.sqrt(distSq);
              const falloff = 1.0 - dist / d.radius;
              const smoothFalloff = falloff * falloff * (3.0 - 2.0 * falloff);
              const pct = d.life / d.maxLife;
              
              const force = smoothFalloff * pct * 0.15; 
              dispCol += d.vx * force;
              dispRow += d.vy * force;
            }
          }
          if (dispCol > maxWarp) dispCol = maxWarp;
          else if (dispCol < -maxWarp) dispCol = -maxWarp;
          if (dispRow > maxWarp) dispRow = maxWarp;
          else if (dispRow < -maxWarp) dispRow = -maxWarp;
        }

        const noiseIdx = noiseRowBase + (col & 255);
        const disp = this.noiseDispCache[noiseIdx];
        
        const srcCol = (col - dispCol + 0.5) | 0;
        const srcRow = (row - dispRow + disp + 0.5) | 0;

        if (srcCol < 0 || srcCol >= cols || srcRow < 0 || srcRow >= rows) continue;

        let imgMaskAlpha = 0;
        let imgAlpha = 0;
        const pyMap = this.pxRows[srcRow];
        if (pyMap >= 0) {
          const alphaVal = this.imgAlphaData ? this.imgAlphaData[pyMap * this.imgW + this.pxCols[srcCol]] : this.imgData![(pyMap * this.imgW + this.pxCols[srcCol]) * 4 + 3];
          imgMaskAlpha = alphaVal;
          imgAlpha = ALPHA_LUT[alphaVal];
        }

        const blobVal = blobAlphaGrid ? blobAlphaGrid[srcRow * cols + srcCol] : 0;
        const blobAlpha255 = (blobVal * 255) | 0;

        const disruption = disruptionGrid ? disruptionGrid[rowBase + col] : 0;
        const disruptionFactor = Math.min(2.0, Math.max(0.0, 1.0 + disruption));

        let combinedMaskAlpha = imgMaskAlpha > blobAlpha255 ? imgMaskAlpha : blobAlpha255;
        if (combinedMaskAlpha === 0) continue;
        combinedMaskAlpha = (combinedMaskAlpha * disruptionFactor) | 0;
        if (combinedMaskAlpha === 0) continue;
        if (combinedMaskAlpha > 255) combinedMaskAlpha = 255;

        let combinedAlpha = imgAlpha > blobVal ? imgAlpha : blobVal;
        combinedAlpha = combinedAlpha * disruptionFactor;
        if (combinedAlpha > 1.0) combinedAlpha = 1.0;
        if (combinedAlpha < threshold) continue;

        const wave = this.noiseWaveCache[noiseIdx];
        
        const gVal = gustMap ? gustMap[rowBase + col] : 0;
        const modulated = Math.min(1, Math.max(0.05, (combinedAlpha - threshold) * invCeilMinThr + wave + gVal));
        const charIdx  = (modulated * charsLenMinus1) | 0;
        if (charIdx === 0) continue;
        const alphaIdx = Math.min(ALPHA_STEPS - 1, (Math.min(1, combinedAlpha * invThresholdD2) * ALPHA_STEPS) | 0);
        const tile = this.glyphAtlas[charIdx][alphaIdx];

        const dstBase32 = row * activeTileSize * bufStride + col * activeTileSize;
        const isBright = CONFIG.bloom.enabled && charIdx >= bloomThresholdIdx;

        if (isBright) {
          hasBrightGlyphs = true;
          for (let ty = 0; ty < activeTileSize; ty++) {
            let srcIdx = ty * activeTileSize;
            let dstIdx32 = dstBase32 + ty * bufStride;
            for (let tx = 0; tx < activeTileSize; tx++, dstIdx32++, srcIdx++) {
              const glyphA = tile[srcIdx];
              if (glyphA !== 0) {
                const alpha = (glyphA * combinedMaskAlpha) >> 8;
                buf32[dstIdx32] = (alpha << 24) | 0x00FFFFFF;
                bloomBuf32[dstIdx32] = (((Math.min(255, (alpha * bloomMask * 1.5) | 0)) << 24) | 0x00FFFFFF);
              }
            }
          }
        } else {
          for (let ty = 0; ty < activeTileSize; ty++) {
            let srcIdx = ty * activeTileSize;
            let dstIdx32 = dstBase32 + ty * bufStride;
            for (let tx = 0; tx < activeTileSize; tx++, dstIdx32++, srcIdx++) {
              const glyphA = tile[srcIdx];
              if (glyphA !== 0) {
                const alpha = (glyphA * combinedMaskAlpha) >> 8;
                buf32[dstIdx32] = (alpha << 24) | 0x00FFFFFF;
              }
            }
          }
        }
      }
    }

    this.offOutCtx.putImageData(this.outImageData!, 0, 0, 0, 0, gridPW, gridPH);

    if (this.cvs.width !== PW || this.cvs.height !== PH) {
      this.cvs.width  = PW;
      this.cvs.height = PH;
    }

    this.ctx.clearRect(0, 0, PW, PH);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.offOut, 0, 0, gridPW, gridPH, 0, 0, PW, PH);
    
    if (CONFIG.bloom.enabled && hasBrightGlyphs) {
      this.bloomOffOutCtx.putImageData(this.bloomImageData!, 0, 0, 0, 0, gridPW, gridPH);
      this.ctx.globalCompositeOperation = "lighter";

      // Radiant glow: 6px blur with 1.0 alpha
      this.ctx.filter = `blur(${Math.max(3, Math.round(5.5 * dpr))}px)`;
      this.ctx.globalAlpha = 1.0;
      this.ctx.drawImage(this.bloomOffOut, 0, 0, gridPW, gridPH, 0, 0, PW, PH);
      
      this.ctx.filter = "none";
      this.ctx.globalCompositeOperation = "source-over";
    }
    this.prevHadBloom = hasBrightGlyphs;
  }
}
