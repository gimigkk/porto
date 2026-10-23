"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { ExperienceItem } from "@/types/experience";
import { ClothingFrontView, ClothingSideView } from "./ClothingGraphics";
import { useTooltip } from "@/components/providers/TooltipProvider";
import { GarmentTooltipContent } from "./tooltips/GarmentTooltipContent";

interface ClothingItemProps {
  item: ExperienceItem;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
  isSelected: boolean;
  targetX: number;
  onSelect: (item: ExperienceItem, index: number) => void;
  isInView?: boolean;
  canHover?: boolean;
  onKeyDownNav?: (e: React.KeyboardEvent) => void;
}

function formatStartDateTag(dateStr: string, isPresent: boolean): string {
  const parts = dateStr.trim().split(/\s+/);
  const [open, close] = isPresent ? ["<", ">"] : ["[", "]"];
  if (parts.length >= 2) {
    const month = parts[0].slice(0, 3).toUpperCase();
    const year = parts[1].slice(-2);
    return `${open}${month}/${year}${close}`;
  }
  return `${open}${dateStr.toUpperCase()}${close}`;
}

export const ClothingItem = React.memo(function ClothingItem({
  item,
  index,
  isFirst = false,
  isLast = false,
  isSelected,
  targetX,
  onSelect,
  isInView = true,
  canHover = false,
  onKeyDownNav,
}: ClothingItemProps) {
  const prevXRef = useRef(targetX);
  const swayAngle = useMotionValue(0);
  const { showTooltip, hideTooltip } = useTooltip();
  const garmentLabel = item.garmentName || item.graphicText || "Garment";

  // Inertial pendular sway on rail slide (calibrated natural cloth momentum)
  useEffect(() => {
    const deltaX = targetX - prevXRef.current;
    let controls: { stop: () => void } | undefined;
    if (Math.abs(deltaX) > 2) {
      const baseTilt = Math.min(Math.max(deltaX / 20, -4), 4);
      swayAngle.set(baseTilt);
      controls = animate(swayAngle, 0, {
        type: "spring",
        stiffness: 140,
        damping: 14,
        mass: 0.8,
      });
    }
    prevXRef.current = targetX;
    return () => {
      controls?.stop();
    };
  }, [targetX, swayAngle]);

  const frontWidth = item.frontWidth ?? (item.frontImage ? 230 : 200);
  const frontLeft = -Math.round(frontWidth / 2);
  const sideWidth = item.sideWidth ?? (item.sideImage ? 76 : 58);
  const sideLeft = -Math.round(sideWidth / 2);

  // Rail top is aligned with left image at Y = 0px.
  // With wrapper at Y = -4px and object-top, hook crook curves over and rests flush on rail.
  const frontStyle: React.CSSProperties = useMemo(
    () => ({
      position: "absolute",
      left: frontLeft,
      top: 0,
      width: frontWidth,
      height: 279,
      transformOrigin: `${Math.round(frontWidth / 2)}px 4px`,
      transform: isSelected ? "rotateY(0deg)" : "rotateY(-73deg)",
      opacity: isSelected ? 1 : 0,
      pointerEvents: isSelected ? "auto" : "none",
      cursor: "pointer",
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      willChange: "transform, opacity",
      transition:
        "transform 0.46s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease-out",
    }),
    [frontLeft, frontWidth, isSelected]
  );

  const sideStyle: React.CSSProperties = useMemo(
    () => ({
      position: "absolute",
      left: sideLeft,
      top: 0,
      width: sideWidth,
      height: 278,
      transformOrigin: `${Math.round(sideWidth / 2)}px 4px`,
      transform: "rotateY(0deg)",
      opacity: isSelected ? 0 : 1,
      pointerEvents: isSelected ? "none" : "auto",
      cursor: "pointer",
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      willChange: "transform, opacity",
      transition: "opacity 0.22s ease-out",
    }),
    [sideLeft, sideWidth, isSelected]
  );

  const handleClick = useCallback(() => {
    onSelect(item, index);
  }, [onSelect, item, index]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(item, index);
      } else if (onKeyDownNav) {
        onKeyDownNav(e);
      }
    },
    [onSelect, item, index, onKeyDownNav]
  );

  return (
    <motion.div
      className={`absolute top-[-4px] select-none ${isSelected ? "z-30" : "z-20"} will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80 rounded-md`}
      style={{
        left: 0,
        transformOrigin: "0px 4px",
      }}
      initial={{ x: targetX }}
      animate={{ x: targetX }}
      transition={{
        type: "spring",
        stiffness: 160,
        damping: 18,
        mass: 0.8,
      }}
      role="tab"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`${item.role} at ${item.company}${isSelected ? " (Selected)" : ""}`}
      onMouseEnter={() => {
        if (canHover) {
          showTooltip(<GarmentTooltipContent name={garmentLabel} />);
        }
      }}
      onMouseLeave={() => {
        if (canHover) {
          hideTooltip();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Desktop-only garment scale (1.20x) anchored at hook apex */}
      <div className="relative origin-[0px_4px] scale-100 lg:scale-[1.20] overflow-visible">
        {/* Entry Drop: lowers hanger and tag from above onto rail with staggered cascade without heavy blur */}
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={
            isInView
              ? { y: 0, opacity: 1 }
              : { y: -48, opacity: 0 }
          }
          transition={{
            type: "spring",
            stiffness: 140,
            damping: 18,
            mass: 0.75,
            delay: 0.12 + index * 0.05,
          }}
        >
          {/* Hover Lift: lifts both hanger and date tag together (pointer: fine only) */}
          <motion.div
            whileHover={
              canHover
                ? {
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 22 },
                }
                : undefined
            }
          >
            {/* Start date tag hovering cleanly above the chrome rail hook */}
            <div className="absolute -top-[32px] left-0 -translate-x-1/2 pointer-events-none select-none whitespace-nowrap z-40">
              <span
                className={`font-mono text-[9px] tracking-wider font-semibold transition-colors duration-200 ${isSelected
                  ? "text-blue-400 drop-shadow-[0_1px_6px_rgba(96,165,250,0.5)]"
                  : "text-zinc-500/80 [@media(hover:hover)]:group-hover:text-zinc-300"
                  }`}
              >
                {formatStartDateTag(item.startDate, item.endDate?.trim().toLowerCase() === "present")}
              </span>
            </div>

            {/* Fabric Momentum Sway */}
            <motion.div
              style={{
                rotate: isSelected ? 0 : swayAngle,
                transformOrigin: "0px 4px",
              }}
              className="will-change-transform"
            >
              {/* 3D Perspective Stage */}
              <div
                className="relative overflow-visible"
                style={{
                  perspective: 1200,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* FRONT VIEW (Symmetric 73° <-> 0° around hook apex) */}
                <div style={frontStyle} onClick={handleClick}>
                  <ClothingFrontView item={item} />

                  {/* Front label under selected garment (desktop only) */}
                  <div
                    className="mt-2 hidden sm:flex flex-col items-center text-center whitespace-nowrap pointer-events-none"
                    style={{
                      opacity: isSelected ? 1 : 0,
                      transition: "opacity 0.22s ease-out",
                    }}
                  >
                    <span className="text-xs font-semibold tracking-wider uppercase text-neutral-200">
                      {item.company}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {item.role}
                    </span>
                  </div>
                </div>

                {/* SIDE VIEW (profile drape on rail with 44px+ touch expander for WCAG 2.5.5) */}
                <div
                  style={sideStyle}
                  onClick={handleClick}
                  className="before:absolute before:-inset-x-3 before:inset-y-0 before:content-[''] before:z-10"
                >
                  <ClothingSideView item={item} isFirst={isFirst} isLast={isLast} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
});
