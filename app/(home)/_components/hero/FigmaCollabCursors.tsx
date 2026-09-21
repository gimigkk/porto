"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

/* ─── Personality traits that shape each cursor's movement character ─── */
interface CursorPersonality {
  range: number;          // max displacement from origin (px)
  minPause: number;       // min seconds between moves
  maxPause: number;       // max seconds between moves
  speedVariation: number; // 0-1, how much spring config varies per move
  burstChance: number;    // 0-1, probability of a fast "flick" move
  inwardDir: { x: number; y: number }; // normalized direction pointing inward towards screen center
  microCorrectionChance: number; // 0-1, chance of a quick follow-up tweak
}

interface CursorData {
  id: string;
  name: string;
  message: string;
  color: string;
  initialPos: { x: number; y: number };
  targetPos: { top: string; left: string };
  personality: CursorPersonality;
  delay: number;
}

const COLLAB_CURSORS: CursorData[] = [
  {
    id: "siwowok",
    name: "Siwowok",
    message: "Gimiaw cookin fr 🔥",
    color: "#ea580c",
    initialPos: { x: 500, y: -250 },
    targetPos: { top: "18%", left: "82%" },
    personality: {
      range: 110,
      minPause: 1.0,
      maxPause: 3.2,
      speedVariation: 0.5,
      burstChance: 0.25,
      inwardDir: { x: -0.85, y: 0.53 }, // Left & Down into hero center
      microCorrectionChance: 0.3,
    },
    delay: 0.2,
  },
  {
    id: "tutua",
    name: "Tutua",
    message: "Check out the projects! 🏹",
    color: "#059669",
    initialPos: { x: -450, y: 350 },
    targetPos: { top: "66%", left: "10%" },
    personality: {
      range: 125,
      minPause: 0.4,
      maxPause: 1.8,
      speedVariation: 0.7,
      burstChance: 0.45,
      inwardDir: { x: 0.88, y: -0.47 }, // Right & Up into hero center
      microCorrectionChance: 0.5,
    },
    delay: 0.5,
  },
  {
    id: "gimiaw",
    name: "Gimiaw",
    message: "Love the ASCII clouds ☁️",
    color: "#dc2626",
    initialPos: { x: -500, y: -300 },
    targetPos: { top: "20%", left: "10%" },
    personality: {
      range: 90,
      minPause: 1.8,
      maxPause: 4.5,
      speedVariation: 0.3,
      burstChance: 0.1,
      inwardDir: { x: 0.82, y: 0.57 }, // Right & Down into hero center
      microCorrectionChance: 0.15,
    },
    delay: 0.35,
  },
  {
    id: "bunga",
    name: "Bunga",
    message: "Lets goooo! 🚀",
    color: "#db2777",
    initialPos: { x: 400, y: 400 },
    targetPos: { top: "68%", left: "84%" },
    personality: {
      range: 115,
      minPause: 0.5,
      maxPause: 2.2,
      speedVariation: 0.6,
      burstChance: 0.5,
      inwardDir: { x: -0.85, y: -0.53 }, // Left & Up into hero center
      microCorrectionChance: 0.45,
    },
    delay: 0.65,
  },
  {
    id: "julio",
    name: "Julio",
    message: "Salam bro! Clean UI ✨",
    color: "#7c3aed",
    initialPos: { x: 0, y: 450 },
    targetPos: { top: "78%", left: "48%" },
    personality: {
      range: 80,
      minPause: 0.5,
      maxPause: 2.8,
      speedVariation: 0.7,
      burstChance: 0.35,
      inwardDir: { x: 0.0, y: -1.0 }, // Gentle upward float
      microCorrectionChance: 0.5,
    },
    delay: 0.8,
  },
];

/* ─── Procedural organic movement hook ─── */
function useOrganicMovement(personality: CursorPersonality, startDelay: number) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let activeControls: Array<{ stop: () => void }> = [];

    // Direction vectors: u is inward pointing, v is perpendicular tangential
    const ux = personality.inwardDir.x;
    const uy = personality.inwardDir.y;
    const vx = -uy;
    const vy = ux;

    const pickTarget = () => {
      const roll = Math.random();
      let dIn: number;
      let dTan: number;

      if (roll < 0.15) {
        // Slight retreat back toward anchor base
        dIn = 4 + Math.random() * (personality.range * 0.2);
        dTan = (Math.random() - 0.5) * (personality.range * 0.4);
      } else if (roll < 0.45) {
        // Small/medium fidget inward
        dIn = 15 + Math.random() * (personality.range * 0.45);
        dTan = (Math.random() - 0.5) * (personality.range * 0.6);
      } else {
        // Bold deep sweep inwards towards hero center
        dIn = personality.range * 0.45 + Math.random() * (personality.range * 0.55);
        dTan = (Math.random() - 0.5) * (personality.range * 0.8);
      }

      return {
        x: ux * dIn + vx * dTan,
        y: uy * dIn + vy * dTan,
      };
    };

    const pickSpring = (isBurst: boolean) => {
      const v = personality.speedVariation;
      if (isBurst) {
        return {
          type: "spring" as const,
          stiffness: 80 + Math.random() * 70 * v,
          damping: 9 + Math.random() * 6 * v,
          mass: 0.6 + Math.random() * 0.3,
        };
      }
      return {
        type: "spring" as const,
        stiffness: 18 + Math.random() * 35 * v,
        damping: 14 + Math.random() * 10 * v,
        mass: 0.8 + Math.random() * 0.5,
      };
    };

    const moveToNext = () => {
      if (cancelled) return;

      // Random pause (simulates reading/thinking)
      const pause = personality.minPause + Math.random() * (personality.maxPause - personality.minPause);

      timeoutId = setTimeout(() => {
        if (cancelled) return;

        const target = pickTarget();
        const isBurst = Math.random() < personality.burstChance;
        const spring = pickSpring(isBurst);

        // Slightly different config per axis for organic asymmetry
        const cx = animate(x, target.x, {
          ...spring,
          damping: spring.damping + (Math.random() - 0.5) * 3,
        });
        const cy = animate(y, target.y, {
          ...spring,
          stiffness: spring.stiffness + (Math.random() - 0.5) * 8,
        });
        activeControls = [cx, cy];

        // After spring settles → maybe micro-correction, then next waypoint
        Promise.all([cx, cy]).then(() => {
          if (cancelled) return;

          // Chance of a quick follow-up tweak (human "oops, a bit more")
          if (Math.random() < personality.microCorrectionChance) {
            const nudgeIn = (Math.random() - 0.3) * 14;
            const nudgeTan = (Math.random() - 0.5) * 14;
            const nx = target.x + ux * nudgeIn + vx * nudgeTan;
            const ny = target.y + uy * nudgeIn + vy * nudgeTan;
            const microPause = 80 + Math.random() * 250;

            timeoutId = setTimeout(() => {
              if (cancelled) return;
              const mcx = animate(x, nx, { type: "spring", stiffness: 120, damping: 14, mass: 0.5 });
              const mcy = animate(y, ny, { type: "spring", stiffness: 120, damping: 14, mass: 0.5 });
              activeControls = [mcx, mcy];
              Promise.all([mcx, mcy]).then(() => {
                if (!cancelled) moveToNext();
              });
            }, microPause);
          } else {
            moveToNext();
          }
        });
      }, pause * 1000);
    };

    // Stagger start per cursor
    timeoutId = setTimeout(moveToNext, startDelay * 1000 + Math.random() * 800);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      activeControls.forEach((c) => c.stop());
    };
  }, [personality, startDelay, x, y]);

  return { x, y };
}

interface FigmaCollabCursorsProps {
  isReady?: boolean;
}

export default function FigmaCollabCursors({ isReady = true }: FigmaCollabCursorsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isReady) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30 select-none hidden md:block">
      {COLLAB_CURSORS.map((cursor) => (
        <CollabCursorItem
          key={cursor.id}
          cursor={cursor}
          isHovered={hoveredId === cursor.id}
          onHover={() => setHoveredId(cursor.id)}
          onLeave={() => setHoveredId((prev) => (prev === cursor.id ? null : prev))}
        />
      ))}
    </div>
  );
}

interface CollabCursorItemProps {
  cursor: CursorData;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

// Horizontal padding inside the pill (px-3 = 12px each side)
const PILL_PX = 24;

function CollabCursorItem({ cursor, isHovered, onHover, onLeave }: CollabCursorItemProps) {
  // Measure intrinsic widths of name and full message once on mount
  const nameGhostRef = useRef<HTMLSpanElement>(null);
  const msgGhostRef = useRef<HTMLSpanElement>(null);
  const [nameW, setNameW] = useState<number | null>(null);
  const [msgW, setMsgW] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (nameGhostRef.current) setNameW(nameGhostRef.current.offsetWidth + PILL_PX);
    if (msgGhostRef.current) setMsgW(msgGhostRef.current.offsetWidth + PILL_PX);
  }, []);

  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    onHover();
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      onLeave();
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Procedural organic movement — never repeats, never resets
  const { x: motionX, y: motionY } = useOrganicMovement(cursor.personality, cursor.delay);

  const targetWidth = isHovered ? (msgW ?? 140) : (nameW ?? 60);

  return (
    <motion.div
      initial={{ opacity: 0, x: cursor.initialPos.x, y: cursor.initialPos.y, scale: 0.8 }}
      animate={{
        opacity: 1, x: 0, y: 0, scale: 1,
        transition: { type: "spring", stiffness: 75, damping: 15, mass: 0.9, delay: cursor.delay },
      }}
      style={{ position: "absolute", top: cursor.targetPos.top, left: cursor.targetPos.left }}
      className="pointer-events-none select-none"
    >
      {/* Organic procedural movement — driven by useMotionValue, independent of hover */}
      <motion.div style={{ x: motionX, y: motionY }}>
        <div className="relative flex items-start">
          {/* Expanded Hitbox: 2x base size, grows larger when hovered, debounced */}
          <div
            className="absolute pointer-events-auto cursor-pointer z-20"
            style={{
              top: isHovered ? -24 : -10,
              left: isHovered ? -24 : -10,
              width: (targetWidth + 14) + (isHovered ? 50 : 24),
              height: 39 + (isHovered ? 48 : 20),
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleMouseEnter}
          />
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

          {/* Ghost spans — off-screen, used only for width measurement */}
          <span
            ref={nameGhostRef}
            className="fixed top-[-9999px] left-[-9999px] text-[13px] font-semibold font-sans tracking-tight whitespace-nowrap pointer-events-none select-none"
            aria-hidden="true"
          >
            {cursor.name}
          </span>
          <span
            ref={msgGhostRef}
            className="fixed top-[-9999px] left-[-9999px] text-[13px] font-semibold font-sans tracking-tight whitespace-nowrap pointer-events-none select-none"
            aria-hidden="true"
          >
            {cursor.message}
          </span>

          {/* Badge container — positioned with clean breathing room from arrow notch */}
          <motion.div
            animate={{
              width: targetWidth,
              borderRadius: isHovered ? "2px 13px 13px 13px" : "13px 13px 13px 13px",
            }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="absolute top-[13px] left-[14px] h-[26px] overflow-hidden drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.16)]"
            style={{ backgroundColor: cursor.color }}
          >
            {/* Name label */}
            <span
              className="absolute inset-0 flex items-center px-3 text-white text-[13px] font-semibold font-sans tracking-tight whitespace-nowrap"
              style={{ opacity: isHovered ? 0 : 1, transition: "opacity 0.15s ease" }}
            >
              {cursor.name}
            </span>

            {/* Chat message */}
            <span
              className="absolute inset-0 flex items-center px-3 text-white text-[13px] font-semibold font-sans tracking-tight whitespace-nowrap"
              style={{ opacity: isHovered ? 1 : 0, transition: "opacity 0.15s ease" }}
            >
              {cursor.message}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
