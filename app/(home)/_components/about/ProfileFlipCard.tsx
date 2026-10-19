"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, useInView, animate } from "framer-motion";
import SpotifyBackside from "./SpotifyBackside";

interface ProfileFlipCardProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}

// Aggressive cubic bezier curve with snappy bounce/overshoot
const AGGRESSIVE_EASE = [0.34, 1.56, 0.64, 1] as const;
const TILT_SPRING = { stiffness: 300, damping: 30 };
const SHIFT_SPRING = { stiffness: 120, damping: 20 }; // softer than tilt so the drift is visibly smooth

export default function ProfileFlipCard({ src, alt, sizes, priority = false }: ProfileFlipCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(wrapperRef, { margin: "200px" });
  const pendingTiltRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const rafPending = useRef(false);

  const isCardActive = isMobile ? isFlipped : isHovered;

  useEffect(() => {
    if (!videoRef.current) return;
    if (isCardActive && isInView) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isCardActive, isInView]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia("(max-width: 767px)").matches ||
        window.matchMedia("(hover: none) and (pointer: coarse)").matches
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Motion values & Springs
  const flipProgress = useMotionValue(0); // 0→1 animated with AGGRESSIVE_EASE
  const liftY = useMotionValue(0);
  const tiltX = useSpring(0, TILT_SPRING);
  const tiltY = useSpring(0, TILT_SPRING);
  const shiftX = useSpring(0, SHIFT_SPRING);
  const shiftY = useSpring(0, SHIFT_SPRING);

  // Derived
  const flipDeg = useTransform(flipProgress, [0, 1], [0, 180]);
  const zArc = useTransform(flipProgress, (v: number) => (isMobile ? 0 : Math.sin(v * Math.PI) * 20));

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

  const handleClick = () => {
    if (!isMobile) return;
    setIsFlipped((prev) => {
      const next = !prev;
      animate(flipProgress, next ? 1 : 0, {
        duration: 0.55,
        ease: AGGRESSIVE_EASE,
      });
      return next;
    });
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    animate(flipProgress, 1, {
      duration: 0.55,
      ease: AGGRESSIVE_EASE,
    });
    animate(liftY, -50, {
      duration: 0.55,
      ease: AGGRESSIVE_EASE,
    });
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    animate(flipProgress, 0, {
      duration: 0.55,
      ease: AGGRESSIVE_EASE,
    });
    animate(liftY, 0, {
      duration: 0.55,
      ease: AGGRESSIVE_EASE,
    });
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
      className={`relative w-full h-full rounded-[4px] md:rounded-lg ${isMobile ? "cursor-pointer select-none" : "cursor-default"}`}
      style={{
        perspective: 1000,
        overflow: "visible",
        x: shiftX,
        y: combinedY,
        willChange: "transform",
      }}
      onClick={handleClick}
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
          className="absolute inset-0 rounded-[4px] md:rounded-lg border border-zinc-800"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: isMobile ? "translateZ(1px)" : "translateZ(8px)",
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className="object-cover pointer-events-none rounded-[4px] md:rounded-lg"
            priority={priority}
          />
          {/* Top-down light reflection */}
          <motion.div
            className="absolute inset-0 bg-white pointer-events-none mix-blend-overlay rounded-[4px] md:rounded-lg"
            style={{ opacity: lightOpacity, willChange: "opacity" }}
          />
          {/* Shadow from tilting away from light */}
          <motion.div
            className="absolute inset-0 bg-black pointer-events-none rounded-[4px] md:rounded-lg"
            style={{ opacity: darkOpacity, willChange: "opacity" }}
          />
        </div>

        {/* === THICKNESS LAYERS (THE EDGE) === */}
        {/* Only rendered on desktop where cursor tilts require 3D depth */}
        {!isMobile && Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`thickness-${i}`}
            className="absolute inset-0 rounded-[4px] md:rounded-lg border border-zinc-800 bg-[#0e0e0e]"
            style={{
              transform: `translateZ(${6 - (i * 4)}px)`,
            }}
          />
        ))}

        {/* === BACK === */}
        {/* Wrapper at rotateY(180deg) */}
        <div
          className="absolute inset-0 rounded-[4px] md:rounded-lg border border-zinc-700"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: isMobile ? "rotateY(180deg) translateZ(1px)" : "rotateY(180deg) translateZ(8px)",
            background: "#0e0e0e",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Inner clip wrapper */}
          <div className="absolute inset-0 rounded-[4px] md:rounded-lg">
            <SpotifyBackside isFlipped={isCardActive} isMobile={isMobile} />
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
              transform: isMobile ? "translateZ(20px)" : "translateZ(200px)",
              top: isMobile ? "28%" : "45%",
              left: "50%",
              translate: "-50% -50%",
              width: isMobile ? "55%" : "85%",
              aspectRatio: "1 / 1",
            }}
          >
            {/* Raw GIF without any CSS filters or blooms for maximum performance */}
            <video
              ref={videoRef}
              src={isInView ? "/goyang2.webm" : undefined}
              preload="none"
              loop
              muted
              playsInline
              className="relative w-full h-full object-contain pointer-events-none"
              style={{ filter: "brightness(1.35)" }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
