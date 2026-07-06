"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useTooltip } from "@/components/providers/TooltipProvider";

export function TooltipRenderer() {
  const { isVisible, content } = useTooltip();
  const [mounted, setMounted] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring configuration
  const springConfig = { damping: 20, stiffness: 400, mass: 0.2 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      // Offset slightly so cursor doesn't cover tooltip
      mouseX.set(e.clientX + 15);
      mouseY.set(e.clientY + 15);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && content && (
        <motion.div
          initial={{ width: 0, height: 0, overflow: "hidden", opacity: 0 }}
          animate={{ width: "auto", height: "auto", opacity: 1, transition: { duration: 0.2, ease: "easeInOut" } }}
          exit={{ width: 0, height: 0, opacity: 0, transition: { duration: 0.15, ease: "easeInOut" } }}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            x: smoothX,
            y: smoothY,
            zIndex: 99999, // Super high z-index to stay above everything
            pointerEvents: "none", // Don't block hover events on things underneath
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
