"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { motion, useMotionValue, animate, type ValueAnimationTransition } from "framer-motion";

/* ─── Personality traits that shape each cursor's movement character ─── */
interface CursorPersonality {
  range: number;          // max displacement from origin (px)
  minPause: number;       // min seconds between moves
  maxPause: number;       // max seconds between moves
  speedVariation: number; // 0-1, how much spring config varies per move
  burstChance: number;    // 0-1, probability of a fast "flick" move
  inwardDir: { x: number; y: number }; // normalized direction pointing inward towards screen center
  microCorrectionChance: number; // 0-1, chance of a quick follow-up tweak
  wiggleChance: number;   // 0-1, chance of playful left-right wiggle emote
}

interface CursorData {
  id: string;
  name: string;
  color: string;
  initialPos: { x: number; y: number };
  targetPos: { top: string; left: string };
  personality: CursorPersonality;
  delay: number;
}

interface CollabSlot {
  id: string;
  top: string;
  left: string;
  inwardDir: { x: number; y: number };
  maxUpwardOffset?: number; // In px, caps upward excursion from navbar
}

const DESKTOP_SLOTS: CollabSlot[] = [
  { id: "tr", top: "24%", left: "80%", inwardDir: { x: -0.85, y: 0.53 }, maxUpwardOffset: 70 }, // Top-Right (Siwowok start)
  { id: "bl", top: "66%", left: "10%", inwardDir: { x: 0.88, y: -0.47 } },                       // Bottom-Left (Tutua start)
  { id: "tl", top: "25%", left: "12%", inwardDir: { x: 0.82, y: 0.57 }, maxUpwardOffset: 70 }, // Top-Left (Gimiaw start)
  { id: "br", top: "68%", left: "84%", inwardDir: { x: -0.85, y: -0.53 } },                       // Bottom-Right (Bunga start)
  { id: "bc", top: "78%", left: "48%", inwardDir: { x: 0.0, y: -1.0 } },                          // Bottom-Center (Julio start)
];

const MOBILE_SLOTS: CollabSlot[] = [
  { id: "m-left", top: "64%", left: "18%", inwardDir: { x: 0.7, y: 0.3 } },
  { id: "m-right", top: "70%", left: "54%", inwardDir: { x: -0.6, y: -0.3 } },
];

/* ─── Box-Muller Gaussian / normal distribution sampler ─── */
function sampleGaussian(mean = 0, stdev = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdev;
}

/* ─── Procedural human cursor emote generator (Figma collaborative gestures) ─── */
function createWhimsicalEmoteKeyframes(curX: number, curY: number) {
  const roll = Math.random();

  // 1. Circling / Swirling ("Check this out / look at this") ~28%
  if (roll < 0.28) {
    const steps = 22;
    const dur = 0.46 + Math.random() * 0.12;
    const rx = 13 + Math.random() * 9;
    const ry = 8 + Math.random() * 7;
    const turns = 1.15 + Math.random() * 0.4;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const startAngle = Math.random() * Math.PI * 2;

    const xKeys: number[] = [];
    const yKeys: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const env = Math.pow(Math.sin(Math.PI * t), 0.85);
      const angle = startAngle + dir * t * turns * Math.PI * 2;
      xKeys.push(curX + Math.cos(angle) * rx * env);
      yKeys.push(curY + Math.sin(angle) * ry * env);
    }
    return { duration: dur, xKeys, yKeys };
  }

  // 2. Crisp Double-Shake ("No-no / Attention flick") ~27%
  if (roll < 0.55) {
    const steps = 16;
    const dur = 0.28 + Math.random() * 0.08;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const a1 = (18 + Math.random() * 8) * dir;
    const a2 = -(14 + Math.random() * 6) * dir;
    const yDip = 2.5 + Math.random() * 2;

    const xKeys: number[] = [];
    const yKeys: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const env = Math.pow(Math.sin(Math.PI * t), 0.8);
      const wave = Math.sin(Math.PI * 2 * 1.5 * t);
      const amp = wave >= 0 ? a1 : -a2;
      xKeys.push(curX + amp * env * Math.abs(wave));
      yKeys.push(curY - yDip * env * Math.abs(wave));
    }
    return { duration: dur, xKeys, yKeys };
  }

  // 3. Chaotic Irregular Scribble (high-energy uneven mouse jiggle) ~27%
  if (roll < 0.82) {
    const steps = 24;
    const dur = 0.44 + Math.random() * 0.12;
    const strokeCount = 3 + Math.floor(Math.random() * 2);
    const strokes: Array<{ dist: number; yNudge: number }> = [];
    let d = Math.random() < 0.5 ? 1 : -1;
    for (let s = 0; s < strokeCount; s++) {
      strokes.push({
        dist: d * (13 + Math.random() * 14),
        yNudge: sampleGaussian(0, 3.5),
      });
      d = -d;
    }

    const xKeys: number[] = [];
    const yKeys: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const env = Math.pow(Math.sin(Math.PI * t), 0.85);
      const strokeProgress = t * strokeCount;
      const sIdx = Math.min(strokeCount - 1, Math.floor(strokeProgress));
      const sFract = strokeProgress - sIdx;
      const stroke = strokes[sIdx];
      const strokeWave = Math.sin(Math.PI * sFract);

      xKeys.push(curX + stroke.dist * env * strokeWave);
      yKeys.push(curY + stroke.yNudge * env * strokeWave);
    }
    return { duration: dur, xKeys, yKeys };
  }

  // 4. Lazy Wag (smooth, relaxed wide wave hello) ~18%
  const steps = 20;
  const dur = 0.54 + Math.random() * 0.12;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const Ax = (22 + Math.random() * 8) * dir;
  const Ay = 4 + Math.random() * 2.5;

  const xKeys: number[] = [];
  const yKeys: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const env = Math.pow(Math.sin(Math.PI * t), 0.9);
    const wave = Math.sin(Math.PI * 2 * 1.8 * t);
    xKeys.push(curX + Ax * env * wave);
    yKeys.push(curY - Ay * env * Math.abs(wave));
  }
  return { duration: dur, xKeys, yKeys };
}

const COLLAB_CURSORS: CursorData[] = [
  {
    id: "siwowok",
    name: "Siwowok",
    color: "#ea580c",
    initialPos: { x: 500, y: -250 },
    targetPos: { top: "24%", left: "80%" },
    personality: {
      range: 280,
      minPause: 1.4,
      maxPause: 3.6,
      speedVariation: 0.5,
      burstChance: 0.25,
      inwardDir: { x: -0.85, y: 0.53 }, // Left & Down into hero center
      microCorrectionChance: 0.35,
      wiggleChance: 0.12,
    },
    delay: 0.2,
  },
  {
    id: "tutua",
    name: "Tutua",
    color: "#059669",
    initialPos: { x: -450, y: 350 },
    targetPos: { top: "66%", left: "10%" },
    personality: {
      range: 320,
      minPause: 1.2,
      maxPause: 3.2,
      speedVariation: 0.6,
      burstChance: 0.3,
      inwardDir: { x: 0.88, y: -0.47 }, // Right & Up into hero center
      microCorrectionChance: 0.4,
      wiggleChance: 0.15,
    },
    delay: 0.5,
  },
  {
    id: "gimiaw",
    name: "Gimiaw",
    color: "#dc2626",
    initialPos: { x: -500, y: -300 },
    targetPos: { top: "25%", left: "12%" },
    personality: {
      range: 260,
      minPause: 1.6,
      maxPause: 4.2,
      speedVariation: 0.4,
      burstChance: 0.2,
      inwardDir: { x: 0.82, y: 0.57 }, // Right & Down into hero center
      microCorrectionChance: 0.3,
      wiggleChance: 0.10,
    },
    delay: 0.35,
  },
  {
    id: "bunga",
    name: "Bunga",
    color: "#db2777",
    initialPos: { x: 400, y: 400 },
    targetPos: { top: "68%", left: "84%" },
    personality: {
      range: 300,
      minPause: 1.3,
      maxPause: 3.5,
      speedVariation: 0.55,
      burstChance: 0.25,
      inwardDir: { x: -0.85, y: -0.53 }, // Left & Up into hero center
      microCorrectionChance: 0.35,
      wiggleChance: 0.13,
    },
    delay: 0.65,
  },
  {
    id: "julio",
    name: "Julio",
    color: "#7c3aed",
    initialPos: { x: 0, y: 450 },
    targetPos: { top: "78%", left: "48%" },
    personality: {
      range: 250,
      minPause: 1.5,
      maxPause: 3.8,
      speedVariation: 0.5,
      burstChance: 0.25,
      inwardDir: { x: 0.0, y: -1.0 }, // Upward sweep
      microCorrectionChance: 0.35,
      wiggleChance: 0.11,
    },
    delay: 0.8,
  },
];

/* ─── Procedural organic movement hook ─── */
function useOrganicMovement(personality: CursorPersonality, slot: CollabSlot, startDelay: number, isActive: boolean = true) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hasStartedRef = useRef(false);
  const slotRef = useRef(slot);

  useEffect(() => {
    slotRef.current = slot;
  }, [slot]);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let activeControls: Array<{ stop: () => void }> = [];

    const pickTarget = () => {
      // Dynamic inward and tangential directions from current slot
      const currentSlot = slotRef.current;
      const ux = currentSlot.inwardDir.x;
      const uy = currentSlot.inwardDir.y;
      const vx = -uy;
      const vy = ux;

      // Half-normal distribution:
      // ~60% close/medium moves (40-120px)
      // ~30% wide sweeps (120-220px)
      // ~10% far reach into hero center (220-320px)
      const rawG = Math.abs(sampleGaussian(0, 1));
      const normDist = Math.min(rawG * 0.36, 1.0);
      const dIn = 16 + normDist * personality.range;

      // Tangential spread
      const dTan = sampleGaussian(0, personality.range * 0.3);

      const rawX = ux * dIn + vx * dTan;
      let rawY = uy * dIn + vy * dTan;

      // Safe clamp: ensure cursors in upper slots never venture offscreen or into navbar
      if (currentSlot.maxUpwardOffset !== undefined) {
        rawY = Math.max(-currentSlot.maxUpwardOffset, rawY);
      }

      return {
        x: rawX,
        y: rawY,
        isFar: normDist > 0.55,
      };
    };

    const pickBaseSpring = (isBurst: boolean, isFar: boolean) => {
      const v = personality.speedVariation;
      if (isBurst || isFar) {
        return {
          stiffness: 52 + Math.random() * 20 * v,
          damping: 14 + Math.random() * 3 * v,
          mass: 0.85 + Math.random() * 0.15,
        };
      }
      return {
        stiffness: 36 + Math.random() * 14 * v,
        damping: 14 + Math.random() * 3 * v,
        mass: 0.95 + Math.random() * 0.2,
      };
    };

    const moveToNext = () => {
      if (cancelled) return;

      const basePause = personality.minPause + Math.random() * (personality.maxPause - personality.minPause);

      timeoutId = setTimeout(() => {
        if (cancelled) return;

        const target = pickTarget();
        const currentX = x.get();
        const currentY = y.get();
        const dx = target.x - currentX;
        const dy = target.y - currentY;
        const dist = Math.hypot(dx, dy);

        const isBurst = Math.random() < personality.burstChance;
        const isFast = isBurst || target.isFar;
        const isFarDistance = dist > 85;
        const isDiagonal = Math.abs(dx) > 18 && Math.abs(dy) > 18;

        // Curve ONLY triggers when movement is fast AND across a far distance
        const shouldCurve = isDiagonal && isFast && isFarDistance;
        const baseSpring = pickBaseSpring(isFast, target.isFar);

        // Biomechanical async motor dynamics:
        // Only on fast, long diagonal sweeps do wrist/finger muscle groups de-sync (40-80ms lag),
        // causing the trajectory to crescent. Small or slower moves stay direct/straight.
        const isXLead = shouldCurve
          ? (Math.abs(dx) > Math.abs(dy) ? Math.random() < 0.75 : Math.random() < 0.3)
          : false;
        const motorLag = shouldCurve ? 0.04 + Math.random() * 0.045 : 0;

        let xConfig: ValueAnimationTransition | Record<string, unknown>;
        let yConfig: ValueAnimationTransition | Record<string, unknown>;

        if (shouldCurve) {
          xConfig = {
            type: "spring" as const,
            stiffness: baseSpring.stiffness * (isXLead ? 1.25 : 0.75),
            damping: baseSpring.damping * (isXLead ? 0.88 : 1.18),
            mass: baseSpring.mass,
            delay: !isXLead ? motorLag : 0,
          };
          yConfig = {
            type: "spring" as const,
            stiffness: baseSpring.stiffness * (isXLead ? 0.75 : 1.25),
            damping: baseSpring.damping * (isXLead ? 1.18 : 0.88),
            mass: baseSpring.mass,
            delay: isXLead ? motorLag : 0,
          };
        } else {
          // Short/medium moves: natural human hand pacing
          const profileRoll = Math.random();
          const dur = Math.max(0.45, Math.min(0.9, 0.42 + (dist / 110) * 0.38));

          if (profileRoll < 0.3) {
            // Direct inspection move: decisive start, smooth deceleration
            const config = {
              type: "tween" as const,
              ease: [0.16, 0.84, 0.28, 1] as const,
              duration: dur,
            };
            xConfig = config;
            yConfig = config;
          } else if (profileRoll < 0.58) {
            // Overdamped natural stop (zero bounce, steady halt)
            const config = {
              type: "spring" as const,
              stiffness: 45 + Math.random() * 15,
              damping: 15 + Math.random() * 3,
              mass: 0.9,
            };
            xConfig = config;
            yConfig = config;
          } else if (profileRoll < 0.78) {
            // Crisp tap / nudge
            const config = {
              type: "tween" as const,
              ease: [0.25, 0.1, 0.25, 1] as const,
              duration: dur * 0.9,
            };
            xConfig = config;
            yConfig = config;
          } else {
            // Relaxed natural spring ease
            const config = {
              type: "spring" as const,
              stiffness: baseSpring.stiffness,
              damping: baseSpring.damping,
              mass: baseSpring.mass,
            };
            xConfig = config;
            yConfig = config;
          }
        }

        const cx = animate(x, target.x, xConfig);
        const cy = animate(y, target.y, yConfig);
        activeControls = [cx, cy];

        // After both axes settle → maybe left-right wiggle emote, quick micro-correction, or next waypoint
        Promise.all([cx, cy]).then(() => {
          if (cancelled) return;

          const roll = Math.random();
          const wiggleChance = personality.wiggleChance;

          if (roll < wiggleChance) {
            // Playful Figma collaborative cursor emote (pure X/Y translation, zero rotation)
            const curX = x.get();
            const curY = y.get();
            const w = createWhimsicalEmoteKeyframes(curX, curY);

            const wx = animate(x, w.xKeys, { duration: w.duration, ease: "linear" });
            const wy = animate(y, w.yKeys, { duration: w.duration, ease: "linear" });
            activeControls = [wx, wy];

            Promise.all([wx, wy]).then(() => {
              if (cancelled) return;
              // Human post-emote pause: admire work / check reaction before moving on
              timeoutId = setTimeout(() => {
                if (!cancelled) moveToNext();
              }, 600 + Math.random() * 600);
            });
          } else if (roll < wiggleChance + personality.microCorrectionChance) {
            const currentSlot = slotRef.current;
            const ux = currentSlot.inwardDir.x;
            const uy = currentSlot.inwardDir.y;
            const vx = -uy;
            const vy = ux;
            const nudgeIn = sampleGaussian(0, 16);
            const nudgeTan = sampleGaussian(0, 16);
            const nx = target.x + ux * nudgeIn + vx * nudgeTan;
            const ny = target.y + uy * nudgeIn + vy * nudgeTan;
            const microPause = 120 + Math.random() * 220;

            timeoutId = setTimeout(() => {
              if (cancelled) return;
              const mcx = animate(x, nx, { type: "spring", stiffness: 60, damping: 16, mass: 0.85 });
              const mcy = animate(y, ny, { type: "spring", stiffness: 60, damping: 16, mass: 0.85 });
              activeControls = [mcx, mcy];
              Promise.all([mcx, mcy]).then(() => {
                if (!cancelled) moveToNext();
              });
            }, microPause);
          } else {
            moveToNext();
          }
        });
      }, basePause * 1000);
    };

    // Stagger start per cursor on first mount, shorter random resume after unpause
    const initialDelay = hasStartedRef.current ? Math.random() * 400 : (startDelay * 1000 + Math.random() * 800);
    hasStartedRef.current = true;
    timeoutId = setTimeout(moveToNext, initialDelay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      activeControls.forEach((c) => c.stop());
    };
  }, [personality, startDelay, x, y, isActive]);

  return { x, y };
}

const MOBILE_COLLAB_CURSORS: CursorData[] = [
  {
    id: "m-gimiaw",
    name: "Gimiaw",
    color: "#dc2626",
    initialPos: { x: -80, y: 0 },
    targetPos: { top: "63%", left: "16%" },
    personality: {
      range: 100,
      minPause: 1.5,
      maxPause: 4.0,
      speedVariation: 0.4,
      burstChance: 0.2,
      inwardDir: { x: 0.7, y: 0.3 },
      microCorrectionChance: 0.35,
      wiggleChance: 0.10,
    },
    delay: 0.25,
  },
  {
    id: "m-bunga",
    name: "Bunga",
    color: "#db2777",
    initialPos: { x: 80, y: 0 },
    targetPos: { top: "69%", left: "50%" },
    personality: {
      range: 100,
      minPause: 1.3,
      maxPause: 3.6,
      speedVariation: 0.5,
      burstChance: 0.25,
      inwardDir: { x: -0.6, y: -0.3 },
      microCorrectionChance: 0.35,
      wiggleChance: 0.14,
    },
    delay: 0.5,
  },
];

interface FigmaCollabCursorsProps {
  isReady?: boolean;
}

export default function FigmaCollabCursors({ isReady = true }: FigmaCollabCursorsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMobileScreen = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => (typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false),
    () => false
  );

  // Desktop slot assignment: cursor index -> slot index
  const [desktopSlots, setDesktopSlots] = useState<number[]>([0, 1, 2, 3, 4]);
  // Mobile slot assignment
  const [mobileSlots, setMobileSlots] = useState<number[]>([0, 1]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(containerRef.current);

    const onVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setIsVisible(rect.bottom > 0 && rect.top < window.innerHeight);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isReady]);

  // Whimsical place-switching loop: desktop
  useEffect(() => {
    if (!isVisible || isMobileScreen) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleNextSwap = (delayMs: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;

        // Pick two random distinct cursors to swap places
        const i = Math.floor(Math.random() * COLLAB_CURSORS.length);
        let j = Math.floor(Math.random() * (COLLAB_CURSORS.length - 1));
        if (j >= i) j++;

        setDesktopSlots((prev) => {
          const next = [...prev];
          const tmp = next[i];
          next[i] = next[j];
          next[j] = tmp;
          return next;
        });

        // Schedule next swap in 10-18 seconds
        scheduleNextSwap(10000 + Math.random() * 8000);
      }, delayMs);
    };

    // First whimsical place swap at 5.5-7s after mount
    scheduleNextSwap(5500 + Math.random() * 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isVisible, isMobileScreen]);

  // Whimsical place-switching loop: mobile
  useEffect(() => {
    if (!isVisible || !isMobileScreen) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleNextSwap = (delayMs: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setMobileSlots((prev) => [prev[1], prev[0]]);
        scheduleNextSwap(12000 + Math.random() * 8000);
      }, delayMs);
    };

    scheduleNextSwap(6000 + Math.random() * 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isVisible, isMobileScreen]);

  if (!isReady) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-30 select-none">
      {/* Desktop: all 5 cursors */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        {COLLAB_CURSORS.map((cursor, idx) => {
          const slot = DESKTOP_SLOTS[desktopSlots[idx] ?? idx];
          return (
            <CollabCursorItem
              key={cursor.id}
              cursor={cursor}
              slot={slot}
              isActive={isVisible && !isMobileScreen}
            />
          );
        })}
      </div>

      {/* Mobile: Gimiaw and Bunga */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden block md:hidden">
        {MOBILE_COLLAB_CURSORS.map((cursor, idx) => {
          const slot = MOBILE_SLOTS[mobileSlots[idx] ?? idx];
          return (
            <CollabCursorItem
              key={cursor.id}
              cursor={cursor}
              slot={slot}
              isMobile
              isActive={isVisible && isMobileScreen}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CollabCursorItemProps {
  cursor: CursorData;
  slot: CollabSlot;
  isMobile?: boolean;
  isActive?: boolean;
}

const CollabCursorItem = React.memo(function CollabCursorItem({
  cursor,
  slot,
  isMobile = false,
  isActive = true,
}: CollabCursorItemProps) {
  // Procedural organic movement — never repeats, never resets
  const { x: motionX, y: motionY } = useOrganicMovement(cursor.personality, slot, cursor.delay, isActive);
  const baseScale = isMobile ? 0.72 : 1;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: cursor.initialPos.x,
        y: cursor.initialPos.y,
        scale: 0.8 * baseScale,
        top: slot.top,
        left: slot.left,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: baseScale,
        top: slot.top,
        left: slot.left,
      }}
      transition={{
        opacity: { delay: cursor.delay, duration: 0.4 },
        x: { type: "spring", stiffness: 75, damping: 15, mass: 0.9, delay: cursor.delay },
        y: { type: "spring", stiffness: 75, damping: 15, mass: 0.9, delay: cursor.delay },
        top: { duration: 1.25, ease: [0.32, 0, 0.2, 1] },
        left: { duration: 1.35, ease: [0.28, 0, 0.18, 1] },
        scale: { duration: 0.25 },
      }}
      style={{
        position: "absolute",
        transformOrigin: "top left",
      }}
      className="pointer-events-none select-none"
    >
      {/* Organic procedural movement + whimsical emote */}
      <motion.div style={{ x: motionX, y: motionY }}>
        <div className="relative flex items-start">
          {/* Cursor arrow — compact 17x19 (matches authentic Figma cursor size) */}
          <svg
            width="17" height="19" viewBox="0 0 22 24" fill="none"
            className="drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.16)] shrink-0 relative z-10"
            style={{ color: cursor.color }}
          >
            <path
              d="M0.928548 2.18278C0.619075 1.37094 1.42087 0.569145 2.23271 0.878618L21.4144 8.19323C22.2858 8.52554 22.3643 9.7288 21.5426 10.1706L13.8864 14.2882C13.5658 14.4606 13.3106 14.7397 13.1678 15.0747L9.93922 22.646C9.5539 23.5497 8.32986 23.5517 7.94165 22.6496L0.928548 2.18278Z"
              fill="currentColor" stroke="white" strokeWidth="1.8" strokeLinejoin="round"
            />
          </svg>

          {/* Badge container — name only, static Figma pill */}
          <div
            className="absolute top-[15px] left-[16px] h-[21px] rounded-[2px] px-2 flex items-center drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.16)]"
            style={{ backgroundColor: cursor.color }}
          >
            <span className="text-white text-[13px] font-semibold font-sans tracking-tight whitespace-nowrap">
              {cursor.name}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
