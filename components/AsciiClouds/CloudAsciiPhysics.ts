/**
 * CloudAsciiPhysics.ts
 * 
 * The physics engine for the cloud simulation.
 * Contains pure(ish) state mutation functions that update the positions, velocities,
 * and lifespans of gusts, blobs, and disruption particles over time.
 */
import { CONFIG, CloudState, MouseState, rng, gustRng, spawnGust } from "./CloudAsciiCore";

export function updateGusts(state: CloudState, t: number, cols: number) {
  for (let i = state.gusts.length - 1; i >= 0; i--) {
    if (t - state.gusts[i].born > state.gusts[i].life) state.gusts.splice(i, 1);
  }
  if (
    state.gusts.length < CONFIG.maxGusts &&
    t - state.lastSpawnTime >= CONFIG.spawnInterval * (0.5 + gustRng() * 1.0)
  ) {
    state.gusts.push(spawnGust(t, cols));
    state.lastSpawnTime = t;
  }
}

export function updateBlobs(
  state: CloudState,
  mouse: MouseState,
  dt: number,
  t: number,
  cols: number,
  isIntro: boolean,
  currentW: number,
  currentH: number,
  imgData: Uint8ClampedArray | null,
  imgW: number,
  imgH: number
) {
  const safeW = currentW || 1;
  const safeH = currentH || 1;

  for (let i = state.blobs.length - 1; i >= 0; i--) {
    const b = state.blobs[i];
    b.life -= dt;
    if (b.life <= 0) {
      state.blobs.splice(i, 1);
      continue;
    }

    b.vx += (CONFIG.blobAmbientWind - b.vx) * dt * 1.5;

    for (const g of state.gusts) {
      const age = t - g.born;
      if (age < 0 || age > g.life) continue;

      const center = g.center + g.speed * age;
      const halfW = g.halfWidthFrac * cols;

      const blobCol = (b.px / imgW) * cols;
      const dist = Math.abs(blobCol - center);

      if (dist < halfW) {
        const strength = (1 - dist / halfW) * g.boost * CONFIG.blobWindPush;
        const windDir = g.speed > 0 ? 1 : -1;

        b.vx += windDir * strength * 120 * dt;
        b.vy -= strength * 10 * dt;
      }
    }

    if (CONFIG.cursorDisruptor.enabled && mouse.active) {
      const screenAR = safeW / safeH;
      const zoom = screenAR < 1 ? 1 / screenAR : 1;
      
      const normX = mouse.x / safeW;
      const mImgX = (0.5 + (normX - 0.5) / zoom) * imgW;
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

          b.vx += (dirX * 0.35 + mNormX * 0.65) * force * 140 * dt;
          b.vy += (dirY * 0.35 + mNormY * 0.65) * force * 140 * dt;
        }
      }
    }

    const maxBlobSpeed = CONFIG.cursorDisruptor.maxBlobSpeed;
    const speedSq = b.vx * b.vx + b.vy * b.vy;
    if (speedSq > maxBlobSpeed * maxBlobSpeed) {
      const speed = Math.sqrt(speedSq);
      b.vx = (b.vx / speed) * maxBlobSpeed;
      b.vy = (b.vy / speed) * maxBlobSpeed;
    }

    b.px += b.vx * dt;
    b.py += b.vy * dt;

    b.vx += (rng() - 0.5) * 18 * dt;
    b.vy += (rng() - 0.5) * 10 * dt;
  }

  if (imgData && imgW > 0 && imgH > 0 && state.blobs.length < CONFIG.blobCount) {
    if (rng() < dt * CONFIG.blobSpawnChance * 45) {
      const screenAR = safeW / safeH;
      const zoom = screenAR < 1 ? 1 / screenAR : 1;
      // Spawn in visible horizontal region only
      const u = 0.5 + (rng() - 0.5) / zoom;
      const px = Math.max(0, Math.min(imgW - 1, Math.floor(u * imgW)));
      
      let pyTop = -1;
      let pyBottom = -1;

      for (let y = 0; y < imgH; y++) {
        const idx = (y * imgW + px) * 4;
        if (imgData[idx + 3] > 130) {
          pyTop = y;
          break;
        }
      }

      for (let y = imgH - 1; y >= 0; y--) {
        const idx = (y * imgW + px) * 4;
        if (imgData[idx + 3] > 130) {
          pyBottom = y;
          break;
        }
      }

      if (pyTop !== -1 && pyBottom !== -1) {
        const cloudHeight = pyBottom - pyTop;
        
        const fractionUp = 0.6 + rng() * 0.3; 
        const py = Math.floor(pyBottom - (cloudHeight * fractionUp));

        const maxLife = CONFIG.blobLife[0] + rng() * (CONFIG.blobLife[1] - CONFIG.blobLife[0]);
        const vx = CONFIG.blobAmbientWind + (rng() - 0.5) * 20;
        const vy = CONFIG.blobSpeedY[0] + rng() * (CONFIG.blobSpeedY[1] - CONFIG.blobSpeedY[0]);
        const maxRadius = CONFIG.blobRadius[0] + rng() * (CONFIG.blobRadius[1] - CONFIG.blobRadius[0]);

        const aspectRatio = 0.6 + rng() * 0.8;
        const roughness = 0.1 + rng() * 0.3;
        const lobes = 3 + Math.floor(rng() * 4);
        const rollSpeed = (rng() - 0.5) * 4.0;
        const growthExp = 0.5 + rng() * 1.5;
        const seed = rng() * Math.PI * 2;

        state.blobs.push({
          px, py, vx, vy, maxRadius, aspectRatio, roughness, lobes, rollSpeed, growthExp, seed,
          life: maxLife, maxLife
        });
      }
    }
  }
}

export function updateDisruptions(
  state: CloudState, 
  mouse: MouseState, 
  dt: number, 
  cols: number, 
  rows: number, 
  currentW: number, 
  currentH: number
) {
  const safeW = currentW || 1;
  const safeH = currentH || 1;

  for (let i = state.disruptions.length - 1; i >= 0; i--) {
    const d = state.disruptions[i];
    d.life -= dt;
    if (d.life <= 0) {
      state.disruptions.splice(i, 1);
      continue;
    }
    d.cx += d.vx * dt;
    d.cy += d.vy * dt;
    d.vx *= Math.exp(-dt * 3.0);
    d.vy *= Math.exp(-dt * 3.0);
  }

  if (mouse.active && mouse.hasMoved) {
    const dx = mouse.x - mouse.px;
    const dy = mouse.y - mouse.py;
    mouse.vx = dx / dt;
    mouse.vy = dy / dt;
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.hasMoved = false;
  } else {
    const damp = Math.exp(-dt * 5);
    mouse.vx *= damp;
    mouse.vy *= damp;
  }

  if (CONFIG.cursorDisruptor.enabled && mouse.active) {
    const mSpeed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
    if (mSpeed > CONFIG.cursorDisruptor.minSpeedToSpawn) {
      const normSpeed = Math.min(1.0, mSpeed / CONFIG.cursorDisruptor.maxSpeedReference);
      
      const speedCurve = Math.pow(normSpeed, 1.2);
      const mCol = (mouse.x / safeW) * cols;
      const mRow = (mouse.y / safeH) * rows;

      state.disruptions.push({
        cx: mCol,
        cy: mRow,
        vx: (mouse.vx / safeW) * cols * CONFIG.cursorDisruptor.trailFling,
        vy: (mouse.vy / safeH) * rows * CONFIG.cursorDisruptor.trailFling,
        radius: CONFIG.cursorDisruptor.minRadius + speedCurve * (CONFIG.cursorDisruptor.maxRadius - CONFIG.cursorDisruptor.minRadius),
        intensity: speedCurve * CONFIG.cursorDisruptor.maxIntensity,
        life: CONFIG.cursorDisruptor.particleLife,
        maxLife: CONFIG.cursorDisruptor.particleLife,
      });
    }
  }
}
