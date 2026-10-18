import {
  CONFIG,
  CloudState,
  CHARS,
  ALPHA_STEPS,
  NOISE,
  NOISE_H,
  NOISE_W,
  buildGlyphAtlas,
} from "./CloudAsciiCore";
import {
  VS_FULLSCREEN,
  VS_POST,
  FS_CELL_COMPUTE,
  FS_MAIN,
  FS_BLOOM_SOURCE,
  FS_BLUR,
  FS_COMPOSITE,
} from "./CloudAsciiShaders";

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create WebGL shader");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || "unknown error";
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  if (!prog) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error("Unable to create WebGL program");
  }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.detachShader(prog, vs);
  gl.detachShader(prog, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog) || "unknown error";
    gl.deleteProgram(prog);
    throw new Error(`Program link error: ${info}`);
  }
  return prog;
}

function computeGaussianKernel(sigma: number, weights: Float32Array, offsets: Float32Array): number {
  const twoSigmaSq = 2 * sigma * sigma;
  const w0 = 1.0;
  let totalWeight = w0;

  for (let k = 0; k < 4; k++) {
    const i1 = 2 * k + 1;
    const i2 = 2 * k + 2;
    const w1 = Math.exp(-(i1 * i1) / twoSigmaSq);
    const w2 = Math.exp(-(i2 * i2) / twoSigmaSq);
    const wSum = w1 + w2;
    weights[k] = wSum;
    offsets[k] = wSum > 1e-6 ? (i1 * w1 + i2 * w2) / wSum : i1;
    totalWeight += 2 * wSum;
  }

  const invTotal = 1 / totalWeight;
  for (let k = 0; k < 4; k++) {
    weights[k] *= invTotal;
  }
  return w0 * invTotal;
}

const BLOOM_DOWN = 4;
const MAX_BLOBS = 48;
const MAX_DISRUPTIONS = 50;
const CLEAR_U32 = new Uint32Array(4);

export class CloudAsciiGPU {
  cvs: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  isContextLost = false;
  ro: ResizeObserver;
  currentW = 0;
  currentH = 0;

  imgData: Uint8ClampedArray | null = null;
  imgW = 0;
  imgH = 0;

  cachedDpr = 0;
  cachedTileSize = 0;
  glyphAtlas: Uint8Array[][] = [];

  private vao: WebGLVertexArrayObject | null = null;

  private cellComputeProg: WebGLProgram | null = null;
  private mainProg: WebGLProgram | null = null;
  private bloomSourceProg: WebGLProgram | null = null;
  private blurProg: WebGLProgram | null = null;
  private compositeProg: WebGLProgram | null = null;

  private cellComputeLocs!: {
    time: WebGLUniformLocation | null;
    cols: WebGLUniformLocation | null;
    rows: WebGLUniformLocation | null;
    imgW: WebGLUniformLocation | null;
    imgH: WebGLUniformLocation | null;
    isMobile: WebGLUniformLocation | null;
    displayAR: WebGLUniformLocation | null;
    introOffsetNorm: WebGLUniformLocation | null;
    isIntro: WebGLUniformLocation | null;
    s: WebGLUniformLocation | null;
    wAmp: WebGLUniformLocation | null;
    dAmp: WebGLUniformLocation | null;
    threshold: WebGLUniformLocation | null;
    invCeilMinThr: WebGLUniformLocation | null;
    invThresholdD2: WebGLUniformLocation | null;
    blobStrength: WebGLUniformLocation | null;
    blobCount: WebGLUniformLocation | null;
    disruptionCount: WebGLUniformLocation | null;
    maxWarp: WebGLUniformLocation | null;
    charsLenMinus1: WebGLUniformLocation | null;
    alphaSteps: WebGLUniformLocation | null;
    bloomEnabled: WebGLUniformLocation | null;
    bloomThresholdIdx: WebGLUniformLocation | null;
    bloomFadeRow: WebGLUniformLocation | null;
    bloomFadeHeight: WebGLUniformLocation | null;
    cloudAlpha: WebGLUniformLocation | null;
    noiseTex: WebGLUniformLocation | null;
    noiseSpeedTex: WebGLUniformLocation | null;
    blobTex: WebGLUniformLocation | null;
    disruptionTex: WebGLUniformLocation | null;
    gustMap: WebGLUniformLocation | null;
  };
  private mainLocs!: {
    cellTex: WebGLUniformLocation | null;
    atlasTex: WebGLUniformLocation | null;
    gridSize: WebGLUniformLocation | null;
    tileSize: WebGLUniformLocation | null;
  };
  private bloomSourceLocs!: {
    cellTex: WebGLUniformLocation | null;
    atlasTex: WebGLUniformLocation | null;
    gridSize: WebGLUniformLocation | null;
    canvasSize: WebGLUniformLocation | null;
    fboSize: WebGLUniformLocation | null;
    tileSize: WebGLUniformLocation | null;
    down: WebGLUniformLocation | null;
  };
  private blurLocs!: {
    image: WebGLUniformLocation | null;
    direction: WebGLUniformLocation | null;
    weight0: WebGLUniformLocation | null;
    weights: WebGLUniformLocation | null;
    offsets: WebGLUniformLocation | null;
  };
  private compositeLocs!: {
    bloomTex: WebGLUniformLocation | null;
  };

  private cloudAlphaTex: WebGLTexture | null = null;
  private noiseTex: WebGLTexture | null = null;
  private noiseSpeedTex: WebGLTexture | null = null;
  private atlasTex: WebGLTexture | null = null;
  private blobTex: WebGLTexture | null = null;
  private disruptionTex: WebGLTexture | null = null;
  private gustMapTex: WebGLTexture | null = null;
  private cellTex: WebGLTexture | null = null;

  private cellFBO: WebGLFramebuffer | null = null;
  private bloomFBOs: [WebGLFramebuffer | null, WebGLFramebuffer | null] = [null, null];
  private bloomTextures: [WebGLTexture | null, WebGLTexture | null] = [null, null];

  private cellTexW = 0;
  private cellTexH = 0;
  private gustMapW = 0;
  private gustMapH = 0;
  private lastBloomW = 0;
  private lastBloomH = 0;

  private blobData = new Float32Array(MAX_BLOBS * 3 * 4);
  private disruptionData = new Float32Array(MAX_DISRUPTIONS * 3 * 4);
  private atlasBuf: Uint8Array | null = null;
  private savedAtlas: Uint8Array[][] | null = null;
  private savedTileSize = 0;

  private gustRowCache: Float32Array | null = null;

  private blurWeights = new Float32Array(4);
  private blurOffsets = new Float32Array(4);

  constructor(cvs: HTMLCanvasElement) {
    this.cvs = cvs;
    const gl = cvs.getContext("webgl2", {
      premultipliedAlpha: true,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      throw new Error("WebGL2 not supported");
    }
    this.gl = gl;

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

    cvs.addEventListener("webglcontextlost", this.handleContextLost);
    cvs.addEventListener("webglcontextrestored", this.handleContextRestored);

    this.initGL();
    this.uploadNoiseTextures();
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.isContextLost = true;
  };

  private handleContextRestored = () => {
    this.isContextLost = false;
    this.initGL();
    this.uploadNoiseTextures();
    if (this.imgData && this.imgW > 0 && this.imgH > 0) {
      this.setImageData(this.imgData, this.imgW, this.imgH);
    }
    if (this.savedAtlas && this.savedTileSize > 0) {
      this.uploadGlyphAtlas(this.savedAtlas, this.savedTileSize);
    }
  };

  private initGL() {
    const gl = this.gl;

    this.cellComputeProg = createProgram(gl, VS_FULLSCREEN, FS_CELL_COMPUTE);
    this.cellComputeLocs = {
      time: gl.getUniformLocation(this.cellComputeProg, "u_time"),
      cols: gl.getUniformLocation(this.cellComputeProg, "u_cols"),
      rows: gl.getUniformLocation(this.cellComputeProg, "u_rows"),
      imgW: gl.getUniformLocation(this.cellComputeProg, "u_imgW"),
      imgH: gl.getUniformLocation(this.cellComputeProg, "u_imgH"),
      isMobile: gl.getUniformLocation(this.cellComputeProg, "u_isMobile"),
      displayAR: gl.getUniformLocation(this.cellComputeProg, "u_displayAR"),
      introOffsetNorm: gl.getUniformLocation(this.cellComputeProg, "u_introOffsetNorm"),
      isIntro: gl.getUniformLocation(this.cellComputeProg, "u_isIntro"),
      s: gl.getUniformLocation(this.cellComputeProg, "u_s"),
      wAmp: gl.getUniformLocation(this.cellComputeProg, "u_wAmp"),
      dAmp: gl.getUniformLocation(this.cellComputeProg, "u_dAmp"),
      threshold: gl.getUniformLocation(this.cellComputeProg, "u_threshold"),
      invCeilMinThr: gl.getUniformLocation(this.cellComputeProg, "u_invCeilMinThr"),
      invThresholdD2: gl.getUniformLocation(this.cellComputeProg, "u_invThresholdD2"),
      blobStrength: gl.getUniformLocation(this.cellComputeProg, "u_blobStrength"),
      blobCount: gl.getUniformLocation(this.cellComputeProg, "u_blobCount"),
      disruptionCount: gl.getUniformLocation(this.cellComputeProg, "u_disruptionCount"),
      maxWarp: gl.getUniformLocation(this.cellComputeProg, "u_maxWarp"),
      charsLenMinus1: gl.getUniformLocation(this.cellComputeProg, "u_charsLenMinus1"),
      alphaSteps: gl.getUniformLocation(this.cellComputeProg, "u_alphaSteps"),
      bloomEnabled: gl.getUniformLocation(this.cellComputeProg, "u_bloomEnabled"),
      bloomThresholdIdx: gl.getUniformLocation(this.cellComputeProg, "u_bloomThresholdIdx"),
      bloomFadeRow: gl.getUniformLocation(this.cellComputeProg, "u_bloomFadeRow"),
      bloomFadeHeight: gl.getUniformLocation(this.cellComputeProg, "u_bloomFadeHeight"),
      cloudAlpha: gl.getUniformLocation(this.cellComputeProg, "u_cloudAlpha"),
      noiseTex: gl.getUniformLocation(this.cellComputeProg, "u_noiseTex"),
      noiseSpeedTex: gl.getUniformLocation(this.cellComputeProg, "u_noiseSpeedTex"),
      blobTex: gl.getUniformLocation(this.cellComputeProg, "u_blobTex"),
      disruptionTex: gl.getUniformLocation(this.cellComputeProg, "u_disruptionTex"),
      gustMap: gl.getUniformLocation(this.cellComputeProg, "u_gustMap"),
    };

    this.mainProg = createProgram(gl, VS_FULLSCREEN, FS_MAIN);
    this.mainLocs = {
      cellTex: gl.getUniformLocation(this.mainProg, "u_cellTex"),
      atlasTex: gl.getUniformLocation(this.mainProg, "u_atlasTex"),
      gridSize: gl.getUniformLocation(this.mainProg, "u_gridSize"),
      tileSize: gl.getUniformLocation(this.mainProg, "u_tileSize"),
    };

    this.bloomSourceProg = createProgram(gl, VS_FULLSCREEN, FS_BLOOM_SOURCE);
    this.bloomSourceLocs = {
      cellTex: gl.getUniformLocation(this.bloomSourceProg, "u_cellTex"),
      atlasTex: gl.getUniformLocation(this.bloomSourceProg, "u_atlasTex"),
      gridSize: gl.getUniformLocation(this.bloomSourceProg, "u_gridSize"),
      canvasSize: gl.getUniformLocation(this.bloomSourceProg, "u_canvasSize"),
      fboSize: gl.getUniformLocation(this.bloomSourceProg, "u_fboSize"),
      tileSize: gl.getUniformLocation(this.bloomSourceProg, "u_tileSize"),
      down: gl.getUniformLocation(this.bloomSourceProg, "u_down"),
    };

    this.blurProg = createProgram(gl, VS_POST, FS_BLUR);
    this.blurLocs = {
      image: gl.getUniformLocation(this.blurProg, "u_image"),
      direction: gl.getUniformLocation(this.blurProg, "u_direction"),
      weight0: gl.getUniformLocation(this.blurProg, "u_weight0"),
      weights: gl.getUniformLocation(this.blurProg, "u_weights"),
      offsets: gl.getUniformLocation(this.blurProg, "u_offsets"),
    };

    this.compositeProg = createProgram(gl, VS_POST, FS_COMPOSITE);
    this.compositeLocs = {
      bloomTex: gl.getUniformLocation(this.compositeProg, "u_bloomTex"),
    };

    this.vao = gl.createVertexArray();

    this.cloudAlphaTex = gl.createTexture();
    this.noiseTex = gl.createTexture();
    this.noiseSpeedTex = gl.createTexture();
    this.atlasTex = gl.createTexture();
    this.blobTex = gl.createTexture();
    this.disruptionTex = gl.createTexture();
    this.gustMapTex = gl.createTexture();
    this.cellTex = gl.createTexture();

    const nearestClamp = (tex: WebGLTexture | null) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    nearestClamp(this.cloudAlphaTex);
    nearestClamp(this.noiseTex);
    nearestClamp(this.noiseSpeedTex);
    nearestClamp(this.atlasTex);
    nearestClamp(this.blobTex);
    nearestClamp(this.disruptionTex);
    nearestClamp(this.gustMapTex);
    nearestClamp(this.cellTex);

    gl.bindTexture(gl.TEXTURE_2D, this.gustMapTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array(1));
    this.gustMapW = 1;
    this.gustMapH = 1;

    gl.bindTexture(gl.TEXTURE_2D, this.blobTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, MAX_BLOBS, 3, 0, gl.RGBA, gl.FLOAT, null);

    gl.bindTexture(gl.TEXTURE_2D, this.disruptionTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, MAX_DISRUPTIONS, 3, 0, gl.RGBA, gl.FLOAT, null);

    this.cellFBO = gl.createFramebuffer();
    this.cellTexW = 0;
    this.cellTexH = 0;

    for (let i = 0; i < 2; i++) {
      this.bloomTextures[i] = gl.createTexture();
      this.bloomFBOs[i] = gl.createFramebuffer();
    }
    this.lastBloomW = 0;
    this.lastBloomH = 0;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
  }

  private uploadNoiseTextures() {
    const gl = this.gl;
    const count = NOISE_W * NOISE_H;
    const noiseData = new Float32Array(count * 4);
    const noiseSpeedData = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const ni = i * 5;
      noiseData[i * 4 + 0] = NOISE[ni + 0];
      noiseData[i * 4 + 1] = NOISE[ni + 1];
      noiseData[i * 4 + 2] = NOISE[ni + 2];
      noiseData[i * 4 + 3] = NOISE[ni + 3];
      noiseSpeedData[i] = NOISE[ni + 4];
    }

    gl.bindTexture(gl.TEXTURE_2D, this.noiseTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, NOISE_W, NOISE_H, 0, gl.RGBA, gl.FLOAT, noiseData);

    gl.bindTexture(gl.TEXTURE_2D, this.noiseSpeedTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, NOISE_W, NOISE_H, 0, gl.RED, gl.FLOAT, noiseSpeedData);
  }

  destroy() {
    this.ro.disconnect();
    this.cvs.removeEventListener("webglcontextlost", this.handleContextLost);
    this.cvs.removeEventListener("webglcontextrestored", this.handleContextRestored);

    const gl = this.gl;
    if (this.cellComputeProg) gl.deleteProgram(this.cellComputeProg);
    if (this.mainProg) gl.deleteProgram(this.mainProg);
    if (this.bloomSourceProg) gl.deleteProgram(this.bloomSourceProg);
    if (this.blurProg) gl.deleteProgram(this.blurProg);
    if (this.compositeProg) gl.deleteProgram(this.compositeProg);

    if (this.cloudAlphaTex) gl.deleteTexture(this.cloudAlphaTex);
    if (this.noiseTex) gl.deleteTexture(this.noiseTex);
    if (this.noiseSpeedTex) gl.deleteTexture(this.noiseSpeedTex);
    if (this.atlasTex) gl.deleteTexture(this.atlasTex);
    if (this.blobTex) gl.deleteTexture(this.blobTex);
    if (this.disruptionTex) gl.deleteTexture(this.disruptionTex);
    if (this.gustMapTex) gl.deleteTexture(this.gustMapTex);
    if (this.cellTex) gl.deleteTexture(this.cellTex);

    if (this.cellFBO) gl.deleteFramebuffer(this.cellFBO);
    for (let i = 0; i < 2; i++) {
      if (this.bloomTextures[i]) gl.deleteTexture(this.bloomTextures[i]!);
      if (this.bloomFBOs[i]) gl.deleteFramebuffer(this.bloomFBOs[i]!);
    }
    if (this.vao) gl.deleteVertexArray(this.vao);
  }

  getEffectiveDpr(): number {
    return Math.min(window.devicePixelRatio || 1, 1.5);
  }

  setImageData(data: Uint8ClampedArray, w: number, h: number) {
    this.imgData = data;
    this.imgW = w;
    this.imgH = h;
    if (this.isContextLost) return;

    const gl = this.gl;
    const len = w * h;
    const alpha = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      alpha[i] = data[i * 4 + 3];
    }

    gl.bindTexture(gl.TEXTURE_2D, this.cloudAlphaTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, alpha);
  }

  setGlyphAtlas(atlas: Uint8Array[][], tileSize: number) {
    this.savedAtlas = atlas;
    this.savedTileSize = tileSize;
    this.glyphAtlas = atlas;
    this.cachedTileSize = tileSize;
    this.cachedDpr = this.getEffectiveDpr();
    if (!this.isContextLost) {
      this.uploadGlyphAtlas(atlas, tileSize);
    }
  }

  private uploadGlyphAtlas(atlas: Uint8Array[][], tileSize: number) {
    const gl = this.gl;
    const numChars = CHARS.length;
    const atlasW = numChars * tileSize;
    const atlasH = ALPHA_STEPS * tileSize;
    const totalBytes = atlasW * atlasH;

    if (!this.atlasBuf || this.atlasBuf.length < totalBytes) {
      this.atlasBuf = new Uint8Array(totalBytes);
    }
    const buf = this.atlasBuf;

    for (let ci = 0; ci < numChars; ci++) {
      const charTiles = atlas[ci];
      const xBase = ci * tileSize;
      for (let ai = 0; ai < ALPHA_STEPS; ai++) {
        const tile = charTiles[ai];
        const yBase = ai * tileSize;
        for (let ty = 0; ty < tileSize; ty++) {
          const srcRowOffset = ty * tileSize;
          const dstRowOffset = (yBase + ty) * atlasW + xBase;
          for (let tx = 0; tx < tileSize; tx++) {
            buf[dstRowOffset + tx] = tile[srcRowOffset + tx];
          }
        }
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8UI,
      atlasW,
      atlasH,
      0,
      gl.RED_INTEGER,
      gl.UNSIGNED_BYTE,
      buf.subarray(0, totalBytes)
    );
  }

  private resizeBloom(bloomW: number, bloomH: number) {
    const gl = this.gl;
    this.lastBloomW = bloomW;
    this.lastBloomH = bloomH;

    for (let i = 0; i < 2; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTextures[i]);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        bloomW,
        bloomH,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBOs[i]);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        this.bloomTextures[i],
        0
      );
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
        
        const yDist = Math.abs(rowFrac - g.yCenter) / (g.yHeight * 0.5);
        if (yDist >= 1) continue;
        
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
            const u = offsetFromCenter * halfWInv;
            const direction = g.speed > 0 ? 1 : -1;
            const directedU = u * direction;

            const noisyU = directedU + (no1 * 0.4 + no2 * 0.2);
            const clampedU = Math.max(-1, Math.min(1, noisyU));

            const baseWave = Math.sin(clampedU * Math.PI);
            const absWave = Math.abs(baseWave);
            let sharpWave = (baseWave < 0 ? -absWave : absWave) * Math.sqrt(absWave);
            if (sharpWave < 0) {
              sharpWave *= 0.4;
            }
            map[rowBase + col] += sharpWave * rowBoostFade * 1.5;
          }
        }
      }
    }
    return map;
  }

  render(
    state: CloudState,
    now: number,
    startTime: number,
    isIntro: boolean,
    introOffsetNorm: number,
    cols: number,
    rows: number
  ) {
    if (this.isContextLost || !this.imgData) return;
    const W = this.currentW;
    const H = this.currentH;
    if (W === 0 || H === 0) return;

    const gl = this.gl;
    const t = (now - startTime) / 1000;
    const dpr = this.getEffectiveDpr();
    const PW = Math.round(W * dpr);
    const PH = Math.round(H * dpr);

    const activeCellSize = W < 768 ? 5 : CONFIG.cellSize;
    const targetTileSize = Math.ceil(activeCellSize * dpr);
    if (this.glyphAtlas.length === 0 || targetTileSize !== this.cachedTileSize || dpr !== this.cachedDpr) {
      this.cachedDpr = dpr;
      this.cachedTileSize = targetTileSize;
      this.glyphAtlas = buildGlyphAtlas(targetTileSize);
      this.setGlyphAtlas(this.glyphAtlas, targetTileSize);
    }

    const activeTileSize = this.cachedTileSize;
    const gridPW = cols * activeTileSize;
    const gridPH = rows * activeTileSize;

    // Pack blob data
    this.blobData.fill(0);
    const blobCount = Math.min(state.blobs.length, MAX_BLOBS);
    const displayAR = W / H;
    const isMobile = displayAR < 1;

    for (let i = 0; i < blobCount; i++) {
      const b = state.blobs[i];
      const pct = b.life / b.maxLife;
      const opacity = pct > 0.7 ? (1 - pct) / 0.3 : pct / 0.7;
      const alphaClamp = Math.min(1, Math.max(0, opacity)) * CONFIG.blobStrength;
      const scaleProg = Math.pow(1 - pct, b.growthExp);
      const currentRadius = b.maxRadius * (0.45 + 0.75 * scaleProg);

      const g_cx = (b.px / this.imgW) * cols;
      let b_normY = b.py / this.imgH;
      let b_radiusY = currentRadius / this.imgH;
      if (isMobile) {
        b_normY = b_normY * displayAR + (1 - displayAR);
        b_radiusY *= displayAR;
      }
      const g_cy = (b_normY + introOffsetNorm) * rows;
      const radiusX = (currentRadius / this.imgW) * cols * b.aspectRatio;
      const radiusY = (b_radiusY * rows) / b.aspectRatio;
      const noisePhase = b.seed + t * 0.15;

      const r0 = i * 4;
      const r1 = (MAX_BLOBS + i) * 4;
      const r2 = (MAX_BLOBS * 2 + i) * 4;

      this.blobData[r0 + 0] = g_cx;
      this.blobData[r0 + 1] = g_cy;
      this.blobData[r0 + 2] = radiusX;
      this.blobData[r0 + 3] = radiusY;

      this.blobData[r1 + 0] = alphaClamp;
      this.blobData[r1 + 1] = noisePhase;
      this.blobData[r1 + 2] = Math.cos(noisePhase * 0.7);
      this.blobData[r1 + 3] = Math.sin(noisePhase * 0.7);

      this.blobData[r2 + 0] = Math.cos(noisePhase);
      this.blobData[r2 + 1] = Math.sin(noisePhase);
      this.blobData[r2 + 2] = b.roughness;
      this.blobData[r2 + 3] = 1 + b.roughness;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.blobTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAX_BLOBS, 3, gl.RGBA, gl.FLOAT, this.blobData);

    // Pack disruption data
    this.disruptionData.fill(0);
    const disruptionCount = Math.min(state.disruptions.length, MAX_DISRUPTIONS);
    for (let i = 0; i < disruptionCount; i++) {
      const d = state.disruptions[i];
      const pct = d.life / d.maxLife;
      const expansion = 1 + (1 - pct) * (CONFIG.cursorDisruptor.expansionFactor - 1);
      const alphaRadius = d.radius * expansion;
      const alphaIntensity = d.intensity * pct;
      const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      const ux = speed > 0.001 ? d.vx / speed : 0;
      const uy = speed > 0.001 ? d.vy / speed : 0;

      const r0 = i * 4;
      const r1 = (MAX_DISRUPTIONS + i) * 4;
      const r2 = (MAX_DISRUPTIONS * 2 + i) * 4;

      this.disruptionData[r0 + 0] = d.cx;
      this.disruptionData[r0 + 1] = d.cy;
      this.disruptionData[r0 + 2] = d.radius;
      this.disruptionData[r0 + 3] = pct * 0.15;

      this.disruptionData[r1 + 0] = alphaRadius;
      this.disruptionData[r1 + 1] = alphaIntensity;
      this.disruptionData[r1 + 2] = d.vx;
      this.disruptionData[r1 + 3] = d.vy;

      this.disruptionData[r2 + 0] = ux;
      this.disruptionData[r2 + 1] = uy;
      this.disruptionData[r2 + 2] = 0;
      this.disruptionData[r2 + 3] = 0;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.disruptionTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAX_DISRUPTIONS, 3, gl.RGBA, gl.FLOAT, this.disruptionData);

    // Build + upload gust map
    const activeCellSizeMax = W < 768 ? 5 : CONFIG.cellSize;
    const maxCols = Math.max(1, Math.floor(W / activeCellSizeMax));
    const maxRows = Math.max(1, Math.floor(H / activeCellSizeMax));

    gl.bindTexture(gl.TEXTURE_2D, this.gustMapTex);
    if (!isIntro && state.gusts.length > 0) {
      const gustMap = this.buildGustMap(state, rows, cols, t, maxRows, maxCols);
      if (cols !== this.gustMapW || rows !== this.gustMapH) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, cols, rows, 0, gl.RED, gl.FLOAT, gustMap.subarray(0, cols * rows));
        this.gustMapW = cols;
        this.gustMapH = rows;
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RED, gl.FLOAT, gustMap.subarray(0, cols * rows));
      }
    } else {
      if (this.gustMapW !== 1 || this.gustMapH !== 1) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array(1));
        this.gustMapW = 1;
        this.gustMapH = 1;
      }
    }

    // Resize canvas if needed
    if (this.cvs.width !== PW || this.cvs.height !== PH) {
      this.cvs.width = PW;
      this.cvs.height = PH;
    }

    gl.bindVertexArray(this.vao);

    // Pass 0 — Cell compute
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cellFBO);
    if (cols !== this.cellTexW || rows !== this.cellTexH) {
      this.cellTexW = cols;
      this.cellTexH = rows;
      gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, cols, rows, 0, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.cellTex, 0);
    }
    gl.viewport(0, 0, cols, rows);
    gl.clearBufferuiv(gl.COLOR, 0, CLEAR_U32);
    gl.disable(gl.BLEND);

    gl.useProgram(this.cellComputeProg);

    const s = CONFIG.speed * 0.018;
    const wAmp = CONFIG.waveDepth * 0.3;
    const dAmp = CONFIG.displacement * 2;
    const { threshold, ceiling } = CONFIG;
    const thresholdD2 = threshold * 0.5 + 0.05;
    const ceilMinThr = ceiling - threshold;
    const invCeilMinThr = 1 / ceilMinThr;
    const invThresholdD2 = 1 / thresholdD2;
    const charsLenMinus1 = CHARS.length - 1;
    const bloomThresholdIdx = CHARS.length - CONFIG.bloom.topGlyphs;
    const bloomFadeRow = rows * 0.85;
    const bloomFadeHeight = rows * 0.15;

    gl.uniform1f(this.cellComputeLocs.time, t);
    gl.uniform1i(this.cellComputeLocs.cols, cols);
    gl.uniform1i(this.cellComputeLocs.rows, rows);
    gl.uniform1i(this.cellComputeLocs.imgW, this.imgW);
    gl.uniform1i(this.cellComputeLocs.imgH, this.imgH);
    gl.uniform1i(this.cellComputeLocs.isMobile, isMobile ? 1 : 0);
    gl.uniform1f(this.cellComputeLocs.displayAR, displayAR);
    gl.uniform1f(this.cellComputeLocs.introOffsetNorm, introOffsetNorm);
    gl.uniform1i(this.cellComputeLocs.isIntro, isIntro ? 1 : 0);
    gl.uniform1f(this.cellComputeLocs.s, s);
    gl.uniform1f(this.cellComputeLocs.wAmp, wAmp);
    gl.uniform1f(this.cellComputeLocs.dAmp, dAmp);
    gl.uniform1f(this.cellComputeLocs.threshold, threshold);
    gl.uniform1f(this.cellComputeLocs.invCeilMinThr, invCeilMinThr);
    gl.uniform1f(this.cellComputeLocs.invThresholdD2, invThresholdD2);
    gl.uniform1f(this.cellComputeLocs.blobStrength, CONFIG.blobStrength);
    gl.uniform1i(this.cellComputeLocs.blobCount, blobCount);
    gl.uniform1i(this.cellComputeLocs.disruptionCount, disruptionCount);
    gl.uniform1f(this.cellComputeLocs.maxWarp, CONFIG.cursorDisruptor.maxWarpDisplacement);
    gl.uniform1i(this.cellComputeLocs.charsLenMinus1, charsLenMinus1);
    gl.uniform1i(this.cellComputeLocs.alphaSteps, ALPHA_STEPS);
    gl.uniform1i(this.cellComputeLocs.bloomEnabled, CONFIG.bloom.enabled ? 1 : 0);
    gl.uniform1i(this.cellComputeLocs.bloomThresholdIdx, bloomThresholdIdx);
    gl.uniform1f(this.cellComputeLocs.bloomFadeRow, bloomFadeRow);
    gl.uniform1f(this.cellComputeLocs.bloomFadeHeight, bloomFadeHeight);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.cloudAlphaTex);
    gl.uniform1i(this.cellComputeLocs.cloudAlpha, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTex);
    gl.uniform1i(this.cellComputeLocs.noiseTex, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseSpeedTex);
    gl.uniform1i(this.cellComputeLocs.noiseSpeedTex, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.blobTex);
    gl.uniform1i(this.cellComputeLocs.blobTex, 3);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.disruptionTex);
    gl.uniform1i(this.cellComputeLocs.disruptionTex, 4);

    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this.gustMapTex);
    gl.uniform1i(this.cellComputeLocs.gustMap, 5);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 1 — Glyph render (to screen)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, PW, PH);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.mainProg);
    gl.uniform1i(this.mainLocs.cellTex, 0);
    gl.uniform1i(this.mainLocs.atlasTex, 1);
    gl.uniform2f(this.mainLocs.gridSize, gridPW, gridPH);
    gl.uniform1i(this.mainLocs.tileSize, activeTileSize);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 2-3 — Bloom
    if (CONFIG.bloom.enabled) {
      const bloomW = Math.max(1, Math.round(PW / BLOOM_DOWN));
      const bloomH = Math.max(1, Math.round(PH / BLOOM_DOWN));

      if (bloomW !== this.lastBloomW || bloomH !== this.lastBloomH) {
        this.resizeBloom(bloomW, bloomH);
      }

      // Bloom source
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBOs[0]);
      gl.viewport(0, 0, bloomW, bloomH);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.BLEND);

      gl.useProgram(this.bloomSourceProg);
      gl.uniform1i(this.bloomSourceLocs.cellTex, 0);
      gl.uniform1i(this.bloomSourceLocs.atlasTex, 1);
      gl.uniform2f(this.bloomSourceLocs.gridSize, gridPW, gridPH);
      gl.uniform2f(this.bloomSourceLocs.canvasSize, PW, PH);
      gl.uniform2f(this.bloomSourceLocs.fboSize, bloomW, bloomH);
      gl.uniform1i(this.bloomSourceLocs.tileSize, activeTileSize);
      gl.uniform1i(this.bloomSourceLocs.down, BLOOM_DOWN);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Blur
      const fullSigma = Math.max(3, Math.round(5.5 * dpr));
      const sigma = Math.max(0.5, fullSigma * (bloomW / PW));
      const w0 = computeGaussianKernel(sigma, this.blurWeights, this.blurOffsets);

      gl.useProgram(this.blurProg);
      gl.uniform1i(this.blurLocs.image, 0);
      gl.uniform1f(this.blurLocs.weight0, w0);
      gl.uniform1fv(this.blurLocs.weights, this.blurWeights);
      gl.uniform1fv(this.blurLocs.offsets, this.blurOffsets);

      // Blur H: bloomFBO[0] -> bloomFBO[1]
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBOs[1]);
      gl.viewport(0, 0, bloomW, bloomH);
      gl.uniform2f(this.blurLocs.direction, 1.0 / bloomW, 0.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTextures[0]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Blur V: bloomFBO[1] -> bloomFBO[0]
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBOs[0]);
      gl.viewport(0, 0, bloomW, bloomH);
      gl.uniform2f(this.blurLocs.direction, 0.0, 1.0 / bloomH);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTextures[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Composite
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, PW, PH);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.compositeProg);
      gl.uniform1i(this.compositeLocs.bloomTex, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTextures[0]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
  }
}
