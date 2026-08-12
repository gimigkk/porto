"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence, useTransform } from "framer-motion";
import { useTooltip } from "@/components/providers/TooltipProvider";
import { tooltipRotationForVelocity } from "./tooltipMotion";

export function TooltipRenderer() {
  const { isVisible, content } = useTooltip();
  const [mounted, setMounted] = useState(false);

  const lastPointerSample = useRef<{ y: number; time: number } | null>(null);
  const rotationResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep cursor coordinates independent so each axis can track smoothly.
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Faster spring for responsive cursor tracking
  const cursorSpringConfig = { damping: 24, stiffness: 700, mass: 0.15 };

  const smoothCursorX = useSpring(cursorX, cursorSpringConfig);
  const smoothCursorY = useSpring(cursorY, cursorSpringConfig);
  const rotationTarget = useMotionValue(0);
  const smoothRotation = useSpring(rotationTarget, {
    damping: 24,
    stiffness: 500,
    mass: 0.2,
  });

  // Combine them into the final rendered coordinates
  const finalX = useTransform(smoothCursorX, (value) => value + 15);
  const finalY = useTransform(smoothCursorY, (value) => value + 15);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const previousSample = lastPointerSample.current;

      if (previousSample) {
        const elapsed = Math.max(now - previousSample.time, 1);
        const verticalVelocity = ((e.clientY - previousSample.y) / elapsed) * 1000;
        rotationTarget.set(tooltipRotationForVelocity(verticalVelocity));

        if (rotationResetTimeout.current) {
          clearTimeout(rotationResetTimeout.current);
        }
        rotationResetTimeout.current = setTimeout(() => {
          rotationTarget.set(0);
          rotationResetTimeout.current = null;
        }, 80);
      }

      lastPointerSample.current = { y: e.clientY, time: now };
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rotationResetTimeout.current) {
        clearTimeout(rotationResetTimeout.current);
        rotationResetTimeout.current = null;
      }
    };
  }, [cursorX, cursorY, rotationTarget]);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && content && (
        <motion.div
          className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden rounded-xl rounded-tl-sm"
          initial={{ scale: 0, opacity: 0, filter: "blur(24px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 30 } }}
          exit={{ scale: 0, opacity: 0, filter: "blur(24px)", transition: { duration: 0.1, ease: "easeIn" } }}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            x: finalX,
            y: finalY,
            rotate: smoothRotation,
            zIndex: 99999, // Super high z-index to stay above everything
            pointerEvents: "none", // Don't block hover events on things underneath
            willChange: "transform, opacity, filter", // Hardware acceleration
            transformOrigin: "-15px -15px",
          }}
        >
          <div className="w-max">
            {content}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

TooltipRenderer.whyDidYouRender = true;
