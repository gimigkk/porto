"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";

interface CursorData {
  id: string;
  name: string;
  message: string;
  color: string;
  initialPos: { x: number; y: number };
  targetPos: { top: string; left: string };
  humanMotion: {
    x: number[];
    y: number[];
    times: number[];
    duration: number;
  };
  delay: number;
}

const COLLAB_CURSORS: CursorData[] = [
  {
    id: "velma",
    name: "Velma",
    message: "Gimiaw cookin fr 🔥",
    color: "#ea580c",
    initialPos: { x: 500, y: -250 },
    targetPos: { top: "18%", left: "82%" },
    humanMotion: {
      x: [0, 0, -35, -35, 25, 25, 10, 10, 0],
      y: [0, 0, 25, 25, -15, -15, 30, 30, 0],
      times: [0, 0.14, 0.22, 0.40, 0.50, 0.68, 0.76, 0.88, 1.0],
      duration: 11.5,
    },
    delay: 0.2,
  },
  {
    id: "robinhood",
    name: "Robin hood",
    message: "Check out the projects! 🏹",
    color: "#059669",
    initialPos: { x: -450, y: 350 },
    targetPos: { top: "66%", left: "10%" },
    humanMotion: {
      x: [0, 0, 35, 35, -20, -20, 20, 20, 0],
      y: [0, 0, -35, -35, -15, -15, 25, 25, 0],
      times: [0, 0.15, 0.24, 0.42, 0.50, 0.68, 0.78, 0.88, 1.0],
      duration: 13.0,
    },
    delay: 0.5,
  },
  {
    id: "blackonblue",
    name: "Black on blue",
    message: "Love the ASCII clouds ☁️",
    color: "#0284c7",
    initialPos: { x: -500, y: -300 },
    targetPos: { top: "20%", left: "10%" },
    humanMotion: {
      x: [0, 0, 30, 30, -15, -15, 15, 15, 0],
      y: [0, 0, 35, 35, 20, 20, -10, -10, 0],
      times: [0, 0.16, 0.25, 0.44, 0.52, 0.70, 0.80, 0.90, 1.0],
      duration: 10.5,
    },
    delay: 0.35,
  },
  {
    id: "letsgo",
    name: "Sarah",
    message: "Lets goooo! 🚀",
    color: "#db2777",
    initialPos: { x: 400, y: 400 },
    targetPos: { top: "68%", left: "84%" },
    humanMotion: {
      x: [0, 0, -30, -30, 20, 20, -10, -10, 0],
      y: [0, 0, -35, -35, -15, -15, 20, 20, 0],
      times: [0, 0.14, 0.22, 0.42, 0.52, 0.70, 0.80, 0.90, 1.0],
      duration: 12.0,
    },
    delay: 0.65,
  },
  {
    id: "salambraat",
    name: "Braaat",
    message: "Salam braaat! Clean UI ✨",
    color: "#7c3aed", // Figma Violet
    initialPos: { x: 0, y: 450 },
    targetPos: { top: "72%", left: "48%" },
    humanMotion: {
      x: [0, 0, -35, -35, 35, 35, 10, 10, 0],
      y: [0, 0, -18, -18, -15, -15, 15, 15, 0],
      times: [0, 0.16, 0.26, 0.44, 0.54, 0.72, 0.82, 0.90, 1.0],
      duration: 12.5,
    },
    delay: 0.8,
  },
];

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
      {/* Human-like cursor movement: multi-speed travel, curved paths, pauses */}
      <motion.div
        animate={{
          x: cursor.humanMotion.x,
          y: cursor.humanMotion.y,
        }}
        transition={{
          duration: cursor.humanMotion.duration,
          times: cursor.humanMotion.times,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
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
