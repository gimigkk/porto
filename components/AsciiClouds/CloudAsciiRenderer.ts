/**
 * CloudAsciiRenderer.ts
 * 
 * The core object-oriented rendering engine.
 * The AsciiRenderer class handles HTMLCanvasElement manipulation, ResizeObserver scaling,
 * off-screen buffer management, and complex pixel-to-ASCII rasterization logic.
 */
import { CONFIG, CloudState, CHARS, ALPHA_STEPS, buildGlyphAtlas, NOISE, NOISE_H, NOISE_W } from "./CloudAsciiCore";

export class AsciiRenderer {
  cvs: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  currentW = 0;
  currentH = 0;
  ro: ResizeObserver;

  imgData: Uint8ClampedArray | null = null;
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

  colPx = new Int32Array(0);
  rowPx = new Int32Array(0);
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
  wasIntro = true;

  lastPW = 0;
  lastPH = 0;
  lastDpr = 0;

  constructor(cvs: HTMLCanvasElement) {
    this.cvs = cvs;
    this.ctx = cvs.getContext("2d")!;
    
    this.offOut = document.createElement("canvas");
    this.offOutCtx = this.offOut.getContext("2d", { willReadFrequently: true })!;

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
    this.currentW = r.width;
    this.currentH = r.height;
  }

  destroy() {
    this.ro.disconnect();
  }

  setImageData(data: Uint8ClampedArray, w: number, h: number) {
    this.imgData = data;
    this.imgW = w;
    this.imgH = h;
  }

  getEffectiveDpr(): number {
    const vvScale = window.visualViewport?.scale ?? 1;
    return (window.devicePixelRatio || 1) * vvScale;
  }

  buildGustMap(state: CloudState, rows: number, cols: number, t: number): Float32Array {
    const reqSize = rows * cols;
    if (!this.gustRowCache || this.gustRowCache.length < reqSize) {
      this.gustRowCache = new Float32Array(reqSize);
    }
    const map = this.gustRowCache;
    map.fill(0);

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

  render(state: CloudState, now: number, startTime: number, isIntro: boolean, introOffsetNorm: number, cols: number, rows: number) {
    if (!this.imgData) return;
    const W = this.currentW, H = this.currentH;
    if (W === 0 || H === 0) return;

    const t   = (now - startTime) / 1000;
    const dpr = this.getEffectiveDpr();

    const PW   = Math.round(W * dpr);
    const PH   = Math.round(H * dpr);

    const targetTileSize = Math.ceil(CONFIG.cellSize * dpr);
    if (targetTileSize !== this.cachedTileSize || dpr !== this.cachedDpr) {
      this.cachedDpr = dpr;
      this.cachedTileSize = targetTileSize;
      this.glyphAtlas = buildGlyphAtlas(targetTileSize);
    }

    if (cols !== this.cachedImageCols || rows !== this.cachedImageRows || isIntro || this.wasIntro) {
      if (this.pxCols.length < cols) this.pxCols = new Int32Array(cols);
      if (this.pxRows.length < rows) this.pxRows = new Int32Array(rows);
      
      for (let c = 0; c < cols; c++) {
        this.pxCols[c] = Math.min(this.imgW - 1, Math.floor(((c + 0.5) / cols) * this.imgW));
      }
      for (let r = 0; r < rows; r++) {
        const normY = (r + 0.5) / rows - introOffsetNorm;
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

    let blobAlphaGrid: Float32Array | null = null;
    if (state.blobs.length > 0) {
      const reqSize = rows * cols;
      if (!this.blobGridCache || this.blobGridCache.length < reqSize) {
        this.blobGridCache = new Float32Array(reqSize);
      }
      blobAlphaGrid = this.blobGridCache;
      blobAlphaGrid.fill(0);

      for (const b of state.blobs) {
        const pct = b.life / b.maxLife;
        const opacity = pct > 0.8 ? (1.0 - pct) / 0.2 : pct / 0.8;
        const alphaClamp = Math.min(1.0, Math.max(0.0, opacity)) * CONFIG.blobStrength;

        const scaleProg = Math.pow(1.0 - pct, b.growthExp);
        const currentRadius = b.maxRadius * (0.45 + 0.75 * scaleProg);

        const g_cx = (b.px / this.imgW) * cols;
        const g_cy = ((b.py / this.imgH) + introOffsetNorm) * rows;

        const g_rx = (currentRadius / this.imgW) * cols;
        const g_ry = (currentRadius / this.imgH) * rows;

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

          for (let c = cMin; c <= cMax; c++) {
            const dx = (c - g_cx) / radiusX;
            const angle = Math.atan2(dy, dx);
            const rotationOffset = t * b.rollSpeed + b.seed;
            
            const wave1 = Math.sin(angle * b.lobes + rotationOffset);
            const wave2 = Math.cos(angle * (b.lobes * 1.9) - rotationOffset * 1.4) * 0.4;
            const wave3 = Math.sin(angle * 0.8 + rotationOffset * 0.3) * 0.5;
            
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

    let disruptionGrid: Float32Array | null = null;
    if (state.disruptions.length > 0) {
      const reqSize = rows * cols;
      if (!this.disruptionGridCache || this.disruptionGridCache.length < reqSize) {
        this.disruptionGridCache = new Float32Array(reqSize);
      }
      disruptionGrid = this.disruptionGridCache;
      disruptionGrid.fill(0);

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
    if (!isIntro) {
      gustMap = this.buildGustMap(state, rows, cols, t);
    }

    if (cols !== this.cachedGridCols || PW !== this.cachedGridPW) {
      if (this.colPx.length < cols + 1) this.colPx = new Int32Array(cols + 1);
      for (let c = 0; c <= cols; c++) this.colPx[c] = Math.round(c * PW / cols);
      this.cachedGridCols = cols;
      this.cachedGridPW   = PW;
    }
    if (rows !== this.cachedGridRows || PH !== this.cachedGridPH) {
      if (this.rowPx.length < rows + 1) this.rowPx = new Int32Array(rows + 1);
      for (let r = 0; r <= rows; r++) this.rowPx[r] = Math.round(r * PH / rows);
      this.cachedGridRows = rows;
      this.cachedGridPH   = PH;
    }

    if (PW !== this.lastPW || PH !== this.lastPH || dpr !== this.lastDpr) {
      this.offOut.width  = PW;
      this.offOut.height = PH;
      this.outImageData  = this.offOutCtx.createImageData(PW, PH);
      this.outBuf        = this.outImageData.data;
      this.outBuf32      = new Uint32Array(this.outBuf.buffer);
      this.outBuf.fill(255);
      this.lastPW = PW; this.lastPH = PH; this.lastDpr = dpr;
    }

    const buf   = this.outBuf!;
    const buf32 = this.outBuf32!;
    const s     = CONFIG.speed * 0.018;
    const wAmp  = CONFIG.waveDepth * 0.3;
    const dAmp  = CONFIG.displacement * 2;
    const { threshold, ceiling } = CONFIG;
    const thresholdD2 = threshold * 0.5 + 0.05;
    const ceilMinThr  = ceiling - threshold;

    buf32.fill(0x00FFFFFF);
    const activeTileSize = this.cachedTileSize;

    for (let row = 0; row < rows; row++) {
      const rowBase = row * cols;
      const pyStart = this.rowPx[row];

      for (let col = 0; col < cols; col++) {
        let dispCol = 0;
        let dispRow = 0;

        if (state.disruptions.length > 0) {
          for (let i = 0; i < state.disruptions.length; i++) {
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
        }

        const maxWarp = CONFIG.cursorDisruptor.maxWarpDisplacement;
        if (dispCol > maxWarp) dispCol = maxWarp;
        else if (dispCol < -maxWarp) dispCol = -maxWarp;
        if (dispRow > maxWarp) dispRow = maxWarp;
        else if (dispRow < -maxWarp) dispRow = -maxWarp;

        const ni = ((row % NOISE_H) * NOISE_W + (col % NOISE_W)) * 5;

        const dPhase = NOISE[ni + 2], dDir = NOISE[ni + 3], dSpeed = NOISE[ni + 4];
        const disp   = Math.sin(t * s * dSpeed + dPhase) * dAmp * dDir;
        
        const srcCol = (col - dispCol + 0.5) | 0;
        const srcRow = (row - dispRow + disp + 0.5) | 0;

        let imgMaskAlpha = 0;
        let blobVal = 0;
        let imgAlpha = 0;

        const isInside = srcCol >= 0 && srcCol < cols && srcRow >= 0 && srcRow < rows;

        if (isInside) {
          const pYMask = this.pxRows[srcRow];
          if (pYMask >= 0) {
            imgMaskAlpha = this.imgData[(pYMask * this.imgW + this.pxCols[srcCol]) * 4 + 3];
          }

          blobVal = blobAlphaGrid ? blobAlphaGrid[srcRow * cols + srcCol] : 0;

          const pYRaw = this.pxRows[srcRow];
          if (pYRaw >= 0) {
            imgAlpha = this.imgData[(pYRaw * this.imgW + this.pxCols[srcCol]) * 4 + 3] / 255;
          }
        }

        const blobAlpha255 = Math.floor(blobVal * 255);

        const disruption = disruptionGrid ? disruptionGrid[rowBase + col] : 0;
        const disruptionFactor = Math.min(2.0, Math.max(0.0, 1.0 + disruption));

        let combinedMaskAlpha = Math.max(imgMaskAlpha, blobAlpha255);
        if (combinedMaskAlpha === 0) continue;
        combinedMaskAlpha = Math.min(255, Math.floor(combinedMaskAlpha * disruptionFactor));
        if (combinedMaskAlpha === 0) continue;

        let combinedAlpha = Math.max(imgAlpha, blobVal);
        combinedAlpha = Math.min(1.0, combinedAlpha * disruptionFactor);
        if (combinedAlpha < threshold) continue;

        const bPhase = NOISE[ni], bSpeed = NOISE[ni + 1];
        const wave   = Math.sin(t * s * bSpeed * 1.3 + bPhase) * wAmp + Math.sin(t * s * bSpeed * 0.6 + bPhase * 1.9) * wAmp * 0.4;
        
        const gVal = gustMap ? gustMap[rowBase + col] : 0;
        const modulated = Math.min(1, Math.max(0.05, (combinedAlpha - threshold) / ceilMinThr + wave + gVal));
        const charIdx  = Math.floor(modulated * (CHARS.length - 1));
        const alphaIdx = Math.min(ALPHA_STEPS - 1, Math.floor(Math.min(1, combinedAlpha / thresholdD2) * ALPHA_STEPS));
        const tile = this.glyphAtlas[charIdx][alphaIdx];

        const pxStart   = this.colPx[col];
        const cellW     = this.colPx[col + 1] - pxStart;
        const cellH     = this.rowPx[row + 1] - pyStart;

        const rowStride = PW * 4;
        const dstBase   = (pyStart * PW + pxStart) * 4;

        const scaleX = activeTileSize / cellW;
        const scaleY = activeTileSize / cellH;

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

    this.offOutCtx.putImageData(this.outImageData!, 0, 0);
    if (this.cvs.width !== PW || this.cvs.height !== PH) {
      this.cvs.width  = PW;
      this.cvs.height = PH;
    }
    
    this.ctx.clearRect(0, 0, PW, PH); 
    this.ctx.drawImage(this.offOut, 0, 0);
  }
}
