import { CHARS, ALPHA_STEPS } from "./CloudAsciiCore";

export const BLOOM_DOWN = 4;

const VS_GRID = `#version 300 es
precision highp float;

out vec2 v_uv;

void main() {
  float x = -1.0 + float((gl_VertexID & 1) << 2);
  float y = -1.0 + float((gl_VertexID & 2) << 1);
  gl_Position = vec4(x, y, 0.0, 1.0);
  v_uv = vec2((x + 1.0) * 0.5, (1.0 - y) * 0.5);
}
`;

const VS_POST = `#version 300 es
precision highp float;

out vec2 v_uv;

void main() {
  float x = -1.0 + float((gl_VertexID & 1) << 2);
  float y = -1.0 + float((gl_VertexID & 2) << 1);
  gl_Position = vec4(x, y, 0.0, 1.0);
  v_uv = vec2((x + 1.0) * 0.5, (y + 1.0) * 0.5);
}
`;

const FS_MAIN = `#version 300 es
precision highp float;
precision highp usampler2D;

in vec2 v_uv;
out vec4 fragColor;

uniform usampler2D u_cellTex;
uniform usampler2D u_atlasTex;
uniform vec2 u_gridSize;
uniform int u_tileSize;

void main() {
  ivec2 gridPixel = clamp(ivec2(floor(v_uv * u_gridSize)), ivec2(0), ivec2(u_gridSize) - 1);
  ivec2 cell = gridPixel / u_tileSize;
  ivec2 inTile = gridPixel - cell * u_tileSize;

  uvec4 cellData = texelFetch(u_cellTex, cell, 0);
  if (cellData.r == 0u) {
    discard;
  }

  uint charIdx = cellData.r;
  uint alphaIdx = cellData.g;
  uint maskAlpha = cellData.b;

  ivec2 atlasPos = ivec2(int(charIdx) * u_tileSize + inTile.x, int(alphaIdx) * u_tileSize + inTile.y);
  uint glyphA = texelFetch(u_atlasTex, atlasPos, 0).r;
  uint alpha = (glyphA * maskAlpha) >> 8u;
  if (alpha == 0u) {
    discard;
  }

  float a = float(alpha) / 255.0;
  fragColor = vec4(a, a, a, a);
}
`;

const FS_BLOOM_SOURCE = `#version 300 es
precision highp float;
precision highp usampler2D;

out vec4 fragColor;

uniform usampler2D u_cellTex;
uniform usampler2D u_atlasTex;
uniform vec2 u_gridSize;
uniform vec2 u_canvasSize;
uniform vec2 u_fboSize;
uniform int u_tileSize;
uniform int u_down;

void main() {
  int fboX = int(gl_FragCoord.x);
  int fboY = int(u_fboSize.y) - 1 - int(gl_FragCoord.y);

  float sumBloom = 0.0;
  vec2 scale = u_gridSize / u_canvasSize;

  for (int dy = 0; dy < 4; dy++) {
    int canvasY = fboY * u_down + dy;
    int gridY = clamp(int(floor(float(canvasY) * scale.y)), 0, int(u_gridSize.y) - 1);
    int cellY = gridY / u_tileSize;
    int inTileY = gridY - cellY * u_tileSize;

    for (int dx = 0; dx < 4; dx++) {
      int canvasX = fboX * u_down + dx;
      int gridX = clamp(int(floor(float(canvasX) * scale.x)), 0, int(u_gridSize.x) - 1);
      int cellX = gridX / u_tileSize;
      int inTileX = gridX - cellX * u_tileSize;

      uvec4 cellData = texelFetch(u_cellTex, ivec2(cellX, cellY), 0);
      if (cellData.r > 0u && cellData.a > 0u) {
        uint charIdx = cellData.r;
        uint alphaIdx = cellData.g;
        uint maskAlpha = cellData.b;

        ivec2 atlasPos = ivec2(int(charIdx) * u_tileSize + inTileX, int(alphaIdx) * u_tileSize + inTileY);
        uint glyphA = texelFetch(u_atlasTex, atlasPos, 0).r;
        uint alpha = (glyphA * maskAlpha) >> 8u;
        if (alpha > 0u) {
          float bloomMask = float(cellData.a) / 255.0;
          sumBloom += min(255.0, floor(float(alpha) * bloomMask * 1.5));
        }
      }
    }
  }

  float a = (sumBloom / float(u_down * u_down)) / 255.0;
  fragColor = vec4(a, a, a, a);
}
`;

const FS_BLUR = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_image;
uniform vec2 u_direction;
uniform float u_weight0;
uniform float u_weights[4];
uniform float u_offsets[4];

void main() {
  vec4 color = texture(u_image, v_uv) * u_weight0;
  for (int i = 0; i < 4; i++) {
    vec2 off = u_direction * u_offsets[i];
    vec2 p1 = v_uv + off;
    vec2 p2 = v_uv - off;
    float b1 = step(0.0, p1.x) * step(p1.x, 1.0) * step(0.0, p1.y) * step(p1.y, 1.0);
    float b2 = step(0.0, p2.x) * step(p2.x, 1.0) * step(0.0, p2.y) * step(p2.y, 1.0);
    color += texture(u_image, p1) * (u_weights[i] * b1);
    color += texture(u_image, p2) * (u_weights[i] * b2);
  }
  fragColor = color;
}
`;

const FS_COMPOSITE = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_bloomTex;

void main() {
  fragColor = texture(u_bloomTex, v_uv);
}
`;

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

export class AsciiGL {
  private cvs: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private isContextLost = false;

  private vao: WebGLVertexArrayObject | null = null;
  private mainProg: WebGLProgram | null = null;
  private bloomSourceProg: WebGLProgram | null = null;
  private blurProg: WebGLProgram | null = null;
  private compositeProg: WebGLProgram | null = null;

  private cellTex: WebGLTexture | null = null;
  private atlasTex: WebGLTexture | null = null;
  private cellTexW = 0;
  private cellTexH = 0;

  private bloomTextures: [WebGLTexture | null, WebGLTexture | null] = [null, null];
  private bloomFBOs: [WebGLFramebuffer | null, WebGLFramebuffer | null] = [null, null];
  private lastBloomW = 0;
  private lastBloomH = 0;

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

  private blurWeights = new Float32Array(4);
  private blurOffsets = new Float32Array(4);

  private atlasBuf: Uint8Array | null = null;
  private savedAtlas: Uint8Array[][] | null = null;
  private savedTileSize = 0;

  constructor(cvs: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.cvs = cvs;
    this.gl = gl;

    cvs.addEventListener("webglcontextlost", this.handleContextLost);
    cvs.addEventListener("webglcontextrestored", this.handleContextRestored);

    this.initGL();
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.isContextLost = true;
  };

  private handleContextRestored = () => {
    this.isContextLost = false;
    this.initGL();
    if (this.savedAtlas && this.savedTileSize > 0) {
      this.uploadGlyphAtlas(this.savedAtlas, this.savedTileSize);
    }
  };

  private initGL() {
    const gl = this.gl;

    this.vao = gl.createVertexArray();

    this.mainProg = createProgram(gl, VS_GRID, FS_MAIN);
    this.mainLocs = {
      cellTex: gl.getUniformLocation(this.mainProg, "u_cellTex"),
      atlasTex: gl.getUniformLocation(this.mainProg, "u_atlasTex"),
      gridSize: gl.getUniformLocation(this.mainProg, "u_gridSize"),
      tileSize: gl.getUniformLocation(this.mainProg, "u_tileSize"),
    };

    this.bloomSourceProg = createProgram(gl, VS_GRID, FS_BLOOM_SOURCE);
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

    this.cellTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.cellTexW = 0;
    this.cellTexH = 0;

    this.atlasTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    for (let i = 0; i < 2; i++) {
      this.bloomTextures[i] = gl.createTexture();
      this.bloomFBOs[i] = gl.createFramebuffer();
    }
    this.lastBloomW = 0;
    this.lastBloomH = 0;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
  }

  setGlyphAtlas(atlas: Uint8Array[][], tileSize: number) {
    this.savedAtlas = atlas;
    this.savedTileSize = tileSize;
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

    gl.activeTexture(gl.TEXTURE1);
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

  render(
    cellBuf: Uint8Array,
    cols: number,
    rows: number,
    tileSize: number,
    gridPW: number,
    gridPH: number,
    PW: number,
    PH: number,
    dpr: number,
    hasBrightGlyphs: boolean
  ) {
    if (this.isContextLost) return;
    const gl = this.gl;

    if (this.cvs.width !== PW || this.cvs.height !== PH) {
      this.cvs.width = PW;
      this.cvs.height = PH;
    }

    // Upload cell buffer
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    const cellCount = cols * rows * 4;
    if (cols !== this.cellTexW || rows !== this.cellTexH) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8UI,
        cols,
        rows,
        0,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_BYTE,
        cellBuf.subarray(0, cellCount)
      );
      this.cellTexW = cols;
      this.cellTexH = rows;
    } else {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        cols,
        rows,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_BYTE,
        cellBuf.subarray(0, cellCount)
      );
    }

    gl.bindVertexArray(this.vao);

    // Bloom pass if bright glyphs present
    if (hasBrightGlyphs) {
      const bloomW = Math.max(1, Math.round(PW / BLOOM_DOWN));
      const bloomH = Math.max(1, Math.round(PH / BLOOM_DOWN));

      if (bloomW !== this.lastBloomW || bloomH !== this.lastBloomH) {
        this.resizeBloom(bloomW, bloomH);
      }

      // Step A: Bloom source
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
      gl.uniform1i(this.bloomSourceLocs.tileSize, tileSize);
      gl.uniform1i(this.bloomSourceLocs.down, BLOOM_DOWN);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Step B: Separable Gaussian blur
      const fullSigma = Math.max(3, Math.round(5.5 * dpr));
      const sigma = Math.max(0.5, fullSigma * (bloomW / PW));
      const w0 = computeGaussianKernel(sigma, this.blurWeights, this.blurOffsets);

      gl.useProgram(this.blurProg);
      gl.uniform1i(this.blurLocs.image, 0);
      gl.uniform1f(this.blurLocs.weight0, w0);
      gl.uniform1fv(this.blurLocs.weights, this.blurWeights);
      gl.uniform1fv(this.blurLocs.offsets, this.blurOffsets);

      // Horizontal blur: FBO 0 -> FBO 1
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBOs[1]);
      gl.viewport(0, 0, bloomW, bloomH);
      gl.uniform2f(this.blurLocs.direction, 1.0 / bloomW, 0.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTextures[0]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Vertical blur: FBO 1 -> FBO 0
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBOs[0]);
      gl.viewport(0, 0, bloomW, bloomH);
      gl.uniform2f(this.blurLocs.direction, 0.0, 1.0 / bloomH);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTextures[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // Step C: Main pass to default framebuffer
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
    gl.uniform1i(this.mainLocs.tileSize, tileSize);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Step D: Bloom composite if bright glyphs present
    if (hasBrightGlyphs) {
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.compositeProg);
      gl.uniform1i(this.compositeLocs.bloomTex, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomTextures[0]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
  }

  destroy() {
    this.cvs.removeEventListener("webglcontextlost", this.handleContextLost);
    this.cvs.removeEventListener("webglcontextrestored", this.handleContextRestored);

    const gl = this.gl;
    if (this.mainProg) gl.deleteProgram(this.mainProg);
    if (this.bloomSourceProg) gl.deleteProgram(this.bloomSourceProg);
    if (this.blurProg) gl.deleteProgram(this.blurProg);
    if (this.compositeProg) gl.deleteProgram(this.compositeProg);

    if (this.cellTex) gl.deleteTexture(this.cellTex);
    if (this.atlasTex) gl.deleteTexture(this.atlasTex);

    for (let i = 0; i < 2; i++) {
      if (this.bloomTextures[i]) gl.deleteTexture(this.bloomTextures[i]!);
      if (this.bloomFBOs[i]) gl.deleteFramebuffer(this.bloomFBOs[i]!);
    }

    if (this.vao) gl.deleteVertexArray(this.vao);
  }
}
