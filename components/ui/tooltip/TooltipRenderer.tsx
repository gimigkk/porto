"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence, useTransform } from "framer-motion";
import { useTooltip } from "@/components/providers/TooltipProvider";

export function TooltipRenderer() {
  const { isVisible, content } = useTooltip();
  const [mounted, setMounted] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  
  // Create separated motion values for cursor and offset
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const offsetX = useMotionValue(15);
  const offsetY = useMotionValue(15);

  // Tight spring for snappy cursor tracking
  const cursorSpringConfig = { damping: 20, stiffness: 400, mass: 0.2 };
  // Faster but overdamped spring for snappy, non-bouncy flipping
  const offsetSpringConfig = { damping: 25, stiffness: 300, mass: 0.2 };

  const smoothCursorX = useSpring(cursorX, cursorSpringConfig);
  const smoothCursorY = useSpring(cursorY, cursorSpringConfig);
  const smoothOffsetX = useSpring(offsetX, offsetSpringConfig);
  const smoothOffsetY = useSpring(offsetY, offsetSpringConfig);

  // Combine them into the final rendered coordinates
  const finalX = useTransform([smoothCursorX, smoothOffsetX], ([c, o]: number[]) => c + o);
  const finalY = useTransform([smoothCursorY, smoothOffsetY], ([c, o]: number[]) => c + o);

  const updatePosition = useCallback(() => {
    let xOffset = 15;
    let yOffset = 15;
    
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      let newFlipX = false;
      let newFlipY = false;
      
      // Flip left if cut off on the right
      if (lastMouse.current.x + 15 + rect.width > window.innerWidth - 10) {
        xOffset = -(rect.width + 15);
        newFlipX = true;
      }
      
      // Flip up if cut off on the bottom
      if (lastMouse.current.y + 15 + rect.height > window.innerHeight - 10) {
        yOffset = -(rect.height + 15);
        newFlipY = true;
      }

      setFlipX(newFlipX);
      setFlipY(newFlipY);
    }

    cursorX.set(lastMouse.current.x);
    cursorY.set(lastMouse.current.y);
    offsetX.set(xOffset);
    offsetY.set(yOffset);
  }, [cursorX, cursorY, offsetX, offsetY]);

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.current = { x: e.clientX, y: e.clientY };
      updatePosition();
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [updatePosition]);

  // Recalculate immediately when content mounts or changes
  useEffect(() => {
    if (isVisible && content) {
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  }, [isVisible, content, updatePosition]);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) return null;

  let cornerClass = "rounded-xl";
  if (!flipX && !flipY) cornerClass += " rounded-tl-sm";
  else if (flipX && !flipY) cornerClass += " rounded-tr-sm";
  else if (!flipX && flipY) cornerClass += " rounded-bl-sm";
  else if (flipX && flipY) cornerClass += " rounded-br-sm";

  return (
    <AnimatePresence>
      {isVisible && content && (
        <motion.div
          className={`bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-300/80 dark:border-neutral-600/80 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden transition-[border-radius] duration-300 ease-out ${cornerClass}`}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{ width: "auto", height: "auto", opacity: 1, transition: { duration: 0.2, ease: "easeInOut" } }}
          exit={{ width: 0, height: 0, opacity: 0, transition: { duration: 0.15, ease: "easeInOut" } }}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            x: finalX,
            y: finalY,
            zIndex: 99999, // Super high z-index to stay above everything
            pointerEvents: "none", // Don't block hover events on things underneath
          }}
        >
          <div className="w-max" ref={contentRef}>
            {content}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
