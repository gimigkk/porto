export const VS_FULLSCREEN = `#version 300 es
// Fullscreen triangle, v_uv top-left origin (0,0)→(1,1)
out vec2 v_uv;
void main() {
  float x = -1.0 + float((gl_VertexID & 1) << 2);
  float y = -1.0 + float((gl_VertexID & 2) << 1);
  gl_Position = vec4(x, y, 0.0, 1.0);
  v_uv = vec2((x + 1.0) * 0.5, (1.0 - y) * 0.5);
}
`;

export const VS_POST = `#version 300 es
precision highp float;

out vec2 v_uv;

void main() {
  float x = -1.0 + float((gl_VertexID & 1) << 2);
  float y = -1.0 + float((gl_VertexID & 2) << 1);
  gl_Position = vec4(x, y, 0.0, 1.0);
  v_uv = vec2((x + 1.0) * 0.5, (y + 1.0) * 0.5);
}
`;

export const FS_CELL_COMPUTE = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

#define MAX_BLOBS 48
#define MAX_DISRUPTIONS 50
#define NOISE_W 300
#define NOISE_H 150

out uvec4 fragColor;

uniform float u_time;
uniform int u_cols;
uniform int u_rows;
uniform int u_imgW;
uniform int u_imgH;
uniform bool u_isMobile;
uniform float u_displayAR;
uniform float u_introOffsetNorm;
uniform bool u_isIntro;
uniform float u_s;
uniform float u_wAmp;
uniform float u_dAmp;
uniform float u_threshold;
uniform float u_invCeilMinThr;
uniform float u_invThresholdD2;
uniform float u_blobStrength;
uniform int u_blobCount;
uniform int u_disruptionCount;
uniform float u_maxWarp;
uniform int u_charsLenMinus1;
uniform int u_alphaSteps;
uniform bool u_bloomEnabled;
uniform int u_bloomThresholdIdx;
uniform float u_bloomFadeRow;
uniform float u_bloomFadeHeight;

uniform sampler2D u_cloudAlpha;
uniform sampler2D u_noiseTex;
uniform sampler2D u_noiseSpeedTex;
uniform sampler2D u_blobTex;
uniform sampler2D u_disruptionTex;
uniform sampler2D u_gustMap;

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  int col = cell.x;
  int row = cell.y;

  // A. Disruption warp displacement
  float dispCol = 0.0;
  float dispRow = 0.0;
  for (int i = 0; i < MAX_DISRUPTIONS; i++) {
    if (i >= u_disruptionCount) break;
    vec4 r0 = texelFetch(u_disruptionTex, ivec2(i, 0), 0);
    vec4 r1 = texelFetch(u_disruptionTex, ivec2(i, 1), 0);
    float dx = float(col) - r0.x;
    float dy = float(row) - r0.y;
    float distSq = dx * dx + dy * dy;
    float rSq = r0.z * r0.z;
    if (distSq < rSq) {
      float dist = sqrt(distSq);
      float falloff = 1.0 - dist / r0.z;
      float smoothFalloff = falloff * falloff * (3.0 - 2.0 * falloff);
      float force = smoothFalloff * r0.w;
      dispCol += r1.z * force;
      dispRow += r1.w * force;
    }
  }
  dispCol = clamp(dispCol, -u_maxWarp, u_maxWarp);
  dispRow = clamp(dispRow, -u_maxWarp, u_maxWarp);

  // B. Noise displacement
  ivec2 noiseCoord = ivec2(col & 0xFF, row % NOISE_H);
  vec4 noiseData = texelFetch(u_noiseTex, noiseCoord, 0);
  float dSpeed = texelFetch(u_noiseSpeedTex, noiseCoord, 0).r;
  float disp = sin(u_time * u_s * dSpeed + noiseData.b) * u_dAmp * noiseData.a;

  // C. Source cell
  int srcCol = clamp(int(round(float(col) - dispCol)), 0, u_cols - 1);
  int srcRow = clamp(int(round(float(row) - dispRow + disp)), 0, u_rows - 1);

  // D. Sample cloud image alpha
  float u = (float(srcCol) + 0.5) / float(u_cols);
  float normY = (float(srcRow) + 0.5) / float(u_rows);
  if (u_isMobile) {
    normY = (normY - (1.0 - u_displayAR)) / u_displayAR;
  }
  normY -= u_introOffsetNorm;
  if (normY < 0.0 || normY >= 1.0) {
    fragColor = uvec4(0u);
    return;
  }
  int imgX = clamp(int(floor(u * float(u_imgW))), 0, u_imgW - 1);
  int imgY = clamp(int(floor(normY * float(u_imgH))), 0, u_imgH - 1);
  float imgAlpha = texelFetch(u_cloudAlpha, ivec2(imgX, imgY), 0).r;
  uint imgMaskAlpha = uint(round(imgAlpha * 255.0));

  // E. Blob contribution
  float blobAlpha = 0.0;
  for (int i = 0; i < MAX_BLOBS; i++) {
    if (i >= u_blobCount) break;
    vec4 r0 = texelFetch(u_blobTex, ivec2(i, 0), 0);
    vec4 r1 = texelFetch(u_blobTex, ivec2(i, 1), 0);
    vec4 r2 = texelFetch(u_blobTex, ivec2(i, 2), 0);

    float bdx = (float(srcCol) - r0.x) / r0.z;
    float bdy = (float(srcRow) - r0.y) / r0.w;
    if (abs(bdx) > r2.w || abs(bdy) > r2.w) {
      continue;
    }
    float dist = length(vec2(bdx, bdy));
    if (dist < 0.001) {
      continue;
    }

    float cosA = bdx / dist;
    float sinA = bdy / dist;
    float sin2A = 2.0 * sinA * cosA;
    float cos2A = cosA * cosA - sinA * sinA;
    float cos_dy_1 = cos(bdy * 1.5 - r1.y * 0.8);
    float cos_dy_2 = cos(bdy * 2.0 + r1.y);
    float noise1 = sin(bdx * 1.5 + r1.y) * cos_dy_1;
    float noise2 = sin(bdx * 2.5 - r1.y * 1.2) * cos_dy_2;
    float sin_2A_P = sin2A * r1.z + cos2A * r1.w;
    float cos_A_minus_P = cosA * r2.x + sinA * r2.y;
    float angleWobble = sin_2A_P * 0.5 + cos_A_minus_P * 0.5;
    float radiusPerturbation = max(0.2, 1.0 + (noise1 * 0.6 + noise2 * 0.3 + angleWobble * 0.5) * r2.z * 0.7);
    float distSq = (bdx * bdx + bdy * bdy) / (radiusPerturbation * radiusPerturbation);
    if (distSq >= 1.0) {
      continue;
    }
    float falloff = exp(-distSq * 2.5);
    float edgeFade = 1.0 - distSq;
    blobAlpha = min(1.0, blobAlpha + falloff * edgeFade * r1.x);
  }

  uint blobAlpha255 = uint(round(blobAlpha * 255.0));

  // F. Disruption alpha grid
  float disruption = 0.0;
  for (int i = 0; i < MAX_DISRUPTIONS; i++) {
    if (i >= u_disruptionCount) break;
    vec4 r0 = texelFetch(u_disruptionTex, ivec2(i, 0), 0);
    vec4 r1 = texelFetch(u_disruptionTex, ivec2(i, 1), 0);
    vec4 r2 = texelFetch(u_disruptionTex, ivec2(i, 2), 0);
    float dx = float(col) - r0.x;
    float dy = float(row) - r0.y;
    float distSq = dx * dx + dy * dy;
    float rSq = r1.x * r1.x;
    if (distSq < rSq) {
      float distRatio = sqrt(distSq) / r1.x;
      float falloff = 1.0 - distRatio * distRatio;
      float proj = dx * r2.x + dy * r2.y;
      float projNorm = proj / r1.x;
      disruption = clamp(disruption + projNorm * falloff * r1.y, -1.0, 1.0);
    }
  }

  float disruptionFactor = clamp(1.0 + disruption, 0.0, 2.0);

  // G. Combine
  uint combinedMaskAlpha = max(imgMaskAlpha, blobAlpha255);
  if (combinedMaskAlpha == 0u) {
    fragColor = uvec4(0u);
    return;
  }
  combinedMaskAlpha = min(255u, uint(float(combinedMaskAlpha) * disruptionFactor));
  if (combinedMaskAlpha == 0u) {
    fragColor = uvec4(0u);
    return;
  }

  float combinedAlpha = max(imgAlpha, blobAlpha) * disruptionFactor;
  combinedAlpha = min(1.0, combinedAlpha);
  if (combinedAlpha < u_threshold) {
    fragColor = uvec4(0u);
    return;
  }

  // H. Wave + gust
  float wave = sin(u_time * u_s * noiseData.g * 1.3 + noiseData.r) * u_wAmp
              + sin(u_time * u_s * noiseData.g * 0.6 + noiseData.r * 1.9) * u_wAmp * 0.4;
  float gustVal = texelFetch(u_gustMap, ivec2(col, row), 0).r;

  float modulated = clamp((combinedAlpha - u_threshold) * u_invCeilMinThr + wave + gustVal, 0.05, 1.0);
  uint charIdx = uint(modulated * float(u_charsLenMinus1));
  if (charIdx == 0u) {
    fragColor = uvec4(0u);
    return;
  }
  uint alphaIdx = min(uint(u_alphaSteps) - 1u, uint(min(1.0, combinedAlpha * u_invThresholdD2) * float(u_alphaSteps)));

  bool isBright = u_bloomEnabled && int(charIdx) >= u_bloomThresholdIdx;
  float bloomMask = float(row) < u_bloomFadeRow ? 1.0 : max(0.0, 1.0 - (float(row) - u_bloomFadeRow) / u_bloomFadeHeight);
  uint bloomByte = isBright ? uint(round(bloomMask * 255.0)) : 0u;

  fragColor = uvec4(charIdx, alphaIdx, combinedMaskAlpha, bloomByte);
}
`;

export const FS_MAIN = `#version 300 es
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

export const FS_BLOOM_SOURCE = `#version 300 es
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

export const FS_BLUR = `#version 300 es
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

export const FS_COMPOSITE = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_bloomTex;

void main() {
  fragColor = texture(u_bloomTex, v_uv);
}
`;
