"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import Image from "next/image";
import { motion, useSpring, useTransform } from "framer-motion";
import SpotifyBackside from "./SpotifyBackside";

interface ProfileFlipCardProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}

// Shared spring — everything syncs to this bounce feel
const FLIP_SPRING = { stiffness: 120, damping: 15, mass: 1.0 };
const TILT_SPRING = { stiffness: 300, damping: 30 };
const SHIFT_SPRING = { stiffness: 120, damping: 20 }; // softer than tilt so the drift is visibly smooth

export default function ProfileFlipCard({ src, alt, sizes, priority = false }: ProfileFlipCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingTiltRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const rafPending = useRef(false);

  useEffect(() => {
    setIsMobile(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  }, []);

  // Springs
  const flipProgress = useSpring(0, FLIP_SPRING); // 0→1
  const tiltX = useSpring(0, TILT_SPRING);
  const tiltY = useSpring(0, TILT_SPRING);
  const shiftX = useSpring(0, SHIFT_SPRING);
  const shiftY = useSpring(0, SHIFT_SPRING);
  const liftY = useSpring(0, FLIP_SPRING);

  // Derived
  const flipDeg = useTransform(flipProgress, [0, 1], [0, 180]);
  const zArc = useTransform(flipProgress, (v: number) => Math.sin(v * Math.PI) * 20);

  // Combined transform string
  const cardTransform = useTransform(
    [tiltX, flipDeg, tiltY, zArc],
    ([rx, fy, ry, rz]: number[]) =>
      `rotateX(${rx}deg) rotateY(${fy + ry}deg) rotateZ(${rz}deg)`
  );
  // Combined Y: lift on hover + subtle cursor shift
  const combinedY = useTransform(
    [liftY, shiftY],
    ([ly, sy]: number[]) => ly + sy
  );
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isMobile || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    // Increased tilt multiplier to 25deg max
    pendingTiltRef.current = { x: -ny * 25, y: nx * 25, sx: nx * 40, sy: ny * 40 };

    if (!rafPending.current) {
      rafPending.current = true;
      requestAnimationFrame(() => {
        tiltX.set(pendingTiltRef.current.x);
        tiltY.set(pendingTiltRef.current.y);
        shiftX.set(pendingTiltRef.current.sx);
        shiftY.set(pendingTiltRef.current.sy);
        rafPending.current = false;
      });
    }
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    flipProgress.set(1);
    liftY.set(-50);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    flipProgress.set(0);
    liftY.set(0);
    tiltX.set(0);
    tiltY.set(0);
    shiftX.set(0);
    shiftY.set(0);
    pendingTiltRef.current = { x: 0, y: 0, sx: 0, sy: 0 };
  };

  // Top-Left directional lighting model:
  // Top tilts towards user (tiltX > 0) + Left tilts towards user (tiltY < 0) = bright
  // Bottom tilts towards user (tiltX < 0) + Right tilts towards user (tiltY > 0) = dark
  const lightOpacity = useTransform(
    [tiltX, tiltY],
    ([tx, ty]: number[]) => Math.max(0, Math.min(0.2, (tx - ty) * 0.008))
  );

  const darkOpacity = useTransform(
    [tiltX, tiltY],
    ([tx, ty]: number[]) => Math.max(0, Math.min(0.2, -(tx - ty) * 0.008))
  );

  return (
    <motion.div
      ref={wrapperRef}
      className="relative w-full h-full cursor-default rounded-lg"
      style={{
        perspective: 1000,
        overflow: "visible",
        x: shiftX,
        y: combinedY,
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Expanded hitbox to prevent edge jitter when tilting sharply */}
      <div
        className="absolute z-0 rounded-[3rem]"
        style={{
          top: isHovered ? -50 : 0,
          bottom: isHovered ? -50 : 0,
          left: isHovered ? -50 : 0,
          right: isHovered ? -50 : 0,
        }}
      />

      <motion.div
        className="relative w-full h-full z-10"
        style={{
          transformStyle: "preserve-3d",
          overflow: "visible",
          transform: cardTransform,
          willChange: "transform",
        }}
      >
        {/* === FRONT === */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden border border-zinc-800"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(8px)",
          }}
        >
          <Image src={src} alt={alt} fill sizes={sizes} className="object-cover pointer-events-none" priority={priority} />
          {/* Top-down light reflection */}
          <motion.div
            className="absolute inset-0 bg-white pointer-events-none mix-blend-overlay"
            style={{ opacity: lightOpacity, willChange: "opacity" }}
          />
          {/* Shadow from tilting away from light */}
          <motion.div
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ opacity: darkOpacity, willChange: "opacity" }}
          />
        </div>

        {/* === THICKNESS LAYERS (THE EDGE) === */}
        {/* Reduced from 8 to 4 for performance while maintaining depth illusion */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`thickness-${i}`}
            className="absolute inset-0 rounded-lg border border-zinc-800 bg-[#0e0e0e]"
            style={{
              transform: `translateZ(${6 - (i * 4)}px)`, // Spread them out significantly
            }}
          />
        ))}

        {/* === BACK === */}
        {/* Wrapper at rotateY(180deg) — must NOT have overflow-hidden so the hologram can protrude via translateZ */}
        <div
          className="absolute inset-0 rounded-lg border border-zinc-700"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg) translateZ(8px)",
            background: "#0e0e0e",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Inner clip wrapper keeps the blurred photo and overlays clipped */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <SpotifyBackside />
            {/* Top-down light reflection */}
            <motion.div
              className="absolute inset-0 bg-white pointer-events-none mix-blend-overlay"
              style={{ opacity: lightOpacity, willChange: "opacity" }}
            />
            {/* Shadow from tilting away from light */}
            <motion.div
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ opacity: darkOpacity, willChange: "opacity" }}
            />
          </div>

          {/* === HOLOGRAM GIF — floats 200px above the card surface === */}
          <div
            className="absolute pointer-events-none"
            style={{
              transform: "translateZ(200px)",
              top: "45%",
              left: "50%",
              translate: "-50% -50%",
              width: "85%",
              aspectRatio: "1 / 1",
            }}
          >
            {/* Raw GIF without any CSS filters or blooms for maximum performance */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/goyang2.gif"
              alt=""
              className="relative w-full h-full object-contain"
              style={{ filter: "brightness(1.35)" }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
