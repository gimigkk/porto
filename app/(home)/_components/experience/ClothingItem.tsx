"use client";

import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { ExperienceItem } from "@/types/experience";
import { ClothingFrontView, ClothingSideView } from "./ClothingGraphics";

interface ClothingItemProps {
  item: ExperienceItem;
  index: number;
  isSelected: boolean;
  targetX: number;
  onSelect: (item: ExperienceItem, index: number) => void;
}

export function ClothingItem({
  item,
  index,
  isSelected,
  targetX,
  onSelect,
}: ClothingItemProps) {
  const prevXRef = useRef(targetX);
  const swayAngle = useMotionValue(0);

  // Subtle inertial momentum sway on rail slide (max ±3° so hook never leaves rail)
  useEffect(() => {
    const deltaX = targetX - prevXRef.current;
    if (Math.abs(deltaX) > 2) {
      const baseTilt = Math.min(Math.max(deltaX / 24, -3), 3);
      swayAngle.set(baseTilt);
      animate(swayAngle, 0, {
        type: "spring",
        stiffness: 120,
        damping: 18,
        mass: 0.9,
      });
    }
    prevXRef.current = targetX;
  }, [targetX, swayAngle]);

  const frontWidth =
    item.id === "exp-7"
      ? 239
      : item.id === "exp-3"
      ? 210
      : item.frontImage
      ? 230
      : 200;
  const frontLeft = -Math.round(frontWidth / 2);
  const sideWidth =
    item.id === "exp-7"
      ? 73
      : item.id === "exp-3"
      ? 81
      : item.sideImage
      ? 76
      : 58;
  const sideLeft = -Math.round(sideWidth / 2);

  // Rail top is aligned with left image at Y = 0px.
  // With wrapper at Y = -4px and object-top, hook crook curves over and rests flush on rail.
  const frontStyle: React.CSSProperties = {
    position: "absolute",
    left: frontLeft,
    top: 0,
    width: frontWidth,
    height: 279,
    transformOrigin: `${Math.round(frontWidth / 2)}px 4px`, // Contact apex on chrome rail
    transform: isSelected ? "rotateY(0deg)" : "rotateY(73deg)",
    opacity: isSelected ? 1 : 0,
    pointerEvents: isSelected ? "auto" : "none",
    cursor: "pointer",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transition:
      "transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease-out",
  };

  const sideStyle: React.CSSProperties = {
    position: "absolute",
    left: sideLeft,
    top: 0,
    width: sideWidth,
    height: 278,
    transformOrigin: `${Math.round(sideWidth / 2)}px 4px`, // Contact apex on chrome rail
    transform: "rotateY(0deg)",
    opacity: isSelected ? 0 : 1,
    pointerEvents: isSelected ? "none" : "auto",
    cursor: "pointer",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transition: "opacity 0.22s ease-out",
  };

  return (
    <motion.div
      className={`absolute top-[-4px] select-none ${isSelected ? "z-30" : "z-20"}`}
      style={{
        left: 0,
        transformOrigin: "0px 4px", // Contact apex on chrome rail
      }}
      initial={{ x: targetX }}
      animate={{ x: targetX }}
      transition={{
        type: "spring",
        stiffness: 140,
        damping: 22,
        mass: 0.85,
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select experience: ${item.role} at ${item.company}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(item, index);
        }
      }}
    >
      {/* Desktop-only garment scale (1.20x) anchored at hook apex */}
      <div className="relative origin-[0px_4px] scale-100 lg:scale-[1.20] overflow-visible">
        {/* Fabric Momentum Sway */}
        <motion.div
          style={{
            rotate: isSelected ? 0 : swayAngle,
            transformOrigin: "0px 4px",
          }}
          whileHover={{
            y: -8, // Clean translateY lift on hover, strictly no rotation
            transition: { type: "spring", stiffness: 400, damping: 25 },
          }}
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
            <div style={frontStyle} onClick={() => onSelect(item, index)}>
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

            {/* SIDE VIEW (profile drape on rail, symmetric crossfade) */}
            <div style={sideStyle} onClick={() => onSelect(item, index)}>
              <ClothingSideView item={item} />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
