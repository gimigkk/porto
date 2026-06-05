"use client";

import { useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  cellSize: 10,

  // Like Photoshop Levels input black point (0–1).
  // Pixels below this brightness are treated as sky and hidden.
  // 0 = show everything, 0.2 = clip dark edges, 0.5 = only bright cores
  threshold: 0.5,

  // Like Photoshop Levels input white point (0–1), must be > threshold.
  // Pixels at or above this are fully opaque. Between threshold and ceiling
  // is a soft feathered edge.
  ceiling: 1,

  speed: 5,

  // How much the wave ripples char density (0–1)
  waveDepth: 0.3,

  // How much cells physically drift (0–1)
  displacement: 0.25,
};
// ─────────────────────────────────────────────────────────────────────────────

// Dense ASCII ramp — chars that actually fill horizontal space
const CHARS = " .:+({[#@";

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

export default function AsciiClouds({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Off-screen A: sample cloud image at grid resolution
    const offSample = document.createElement("canvas");
    const offSampleCtx = offSample.getContext("2d")!;

    // Off-screen B: render ASCII text layer at full resolution
    const offAscii = document.createElement("canvas");
    const offAsciiCtx = offAscii.getContext("2d")!;

    const img = new Image();
    img.src = "/assets/clouds.png";

    const MAX_DISP = 2;

    function render(t: number) {
      const container = canvas!.parentElement;
      if (!container) return;
      const W = container.clientWidth;
      const H = container.clientHeight;
      if (W === 0 || H === 0) return;
      if (!img.complete || img.naturalWidth === 0) return;

      const cs = CONFIG.cellSize;
      const cols = Math.floor(W / cs);
      const rows = Math.floor(H / cs);

      // ── 1. Sample cloud image at grid resolution ──────────────────────────
      offSample.width = cols;
      offSample.height = rows;
      offSampleCtx.drawImage(img, 0, 0, cols, rows);
      const px = offSampleCtx.getImageData(0, 0, cols, rows).data;

      // ── 2. Draw ASCII text layer at full resolution ───────────────────────
      // White text on transparent background — cloud image will mask it
      offAscii.width = W;
      offAscii.height = H;
      offAsciiCtx.clearRect(0, 0, W, H);
      offAsciiCtx.font = `bold ${cs}px monospace`;
      offAsciiCtx.textBaseline = "top";

      const s = CONFIG.speed * 0.018;
      const wAmp = CONFIG.waveDepth * 0.3;
      const dAmp = CONFIG.displacement * MAX_DISP;
      const { threshold, ceiling } = CONFIG;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ni = ((row % NOISE_H) * NOISE_W + (col % NOISE_W)) * 5;
          const bPhase = NOISE[ni];
          const bSpeed = NOISE[ni + 1];
          const dPhase = NOISE[ni + 2];
          const dDir   = NOISE[ni + 3];
          const dSpeed = NOISE[ni + 4];

          // Displacement — organic drift per cell
          const disp = Math.sin(t * s * dSpeed + dPhase) * dAmp * dDir;
          const srcRow = Math.min(rows - 1, Math.max(0, Math.round(row + disp)));

          const idx = (srcRow * cols + col) * 4;
          const r = px[idx], g = px[idx + 1], b = px[idx + 2];
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

          // Hard threshold — like Photoshop black point input
          if (brightness < threshold) continue;

          // Brightness wave — ripples char density
          const wave =
            Math.sin(t * s * bSpeed * 1.3 + bPhase) * wAmp +
            Math.sin(t * s * bSpeed * 0.6 + bPhase * 1.9) * wAmp * 0.4;

          // Remap threshold→ceiling to 0→1, apply wave
          const base = (brightness - threshold) / (ceiling - threshold);
          const modulated = Math.min(1, Math.max(0.05, base + wave));

          // Map to char — brighter = denser char
          const charIdx = Math.floor(modulated * (CHARS.length - 1));
          const ch = CHARS[charIdx];
          if (ch === " ") continue;

          // Opacity from threshold feather — pixels just above threshold are
          // semi-transparent for soft cloud edges
          const edgeAlpha = Math.min(1, (brightness - threshold) / (threshold * 0.5 + 0.05));

          offAsciiCtx.fillStyle = `rgba(255,255,255,${edgeAlpha.toFixed(2)})`;
          offAsciiCtx.fillText(ch, col * cs, row * cs);
        }
      }

      // ── 3. Composite: use cloud image as luminosity mask ──────────────────
      // Draw cloud image with "multiply"-like masking:
      // We use destination-in with the cloud image drawn at reduced opacity
      // so only cloud-bright areas reveal the ASCII layer beneath.
      offAsciiCtx.globalCompositeOperation = "destination-in";
      offAsciiCtx.drawImage(img, 0, 0, W, H);
      offAsciiCtx.globalCompositeOperation = "source-over"; // reset

      // ── 4. Paint final result onto main canvas ────────────────────────────
      canvas!.width = W;
      canvas!.height = H;
      const ctx = canvas!.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(offAscii, 0, 0);
    }

    let frame = 0;
    function loop() {
      render(frame++);
      rafRef.current = requestAnimationFrame(loop);
    }

    if (img.complete && img.naturalWidth > 0) {
      loop();
    } else {
      img.onload = loop;
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}