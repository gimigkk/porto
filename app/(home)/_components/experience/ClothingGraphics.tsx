"use client";

import React from "react";
import { ExperienceItem } from "@/types/experience";

interface GraphicProps {
  item: ExperienceItem;
  className?: string;
}

/**
 * Front view of clothing on wooden hanger
 * Dimensions match source aspect ratio (988x1377 -> 200x279)
 * Scale is 1:1 identical to side view.
 */
export function ClothingFrontView({ item, className = "" }: GraphicProps) {
  const frontSrc = item.frontImage || "/experience/shirt-front.png";

  return (
    <div className={`relative w-[200px] h-[279px] flex flex-col items-center select-none pointer-events-none ${className}`}>
      <img
        src={frontSrc}
        alt={`${item.role} front view`}
        className="w-full h-full block drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] pointer-events-none"
        draggable={false}
      />
    </div>
  );
}

/**
 * Side view of clothing on wooden hanger
 * Dimensions match source aspect ratio (288x1382 -> 58x278)
 * Scale is 1:1 identical to front view.
 */
export function ClothingSideView({ item, className = "" }: GraphicProps) {
  const sideSrc = item.sideImage || "/experience/shirt-side.png";

  return (
    <div className={`relative w-[58px] h-[278px] flex flex-col items-center select-none pointer-events-none ${className}`}>
      <img
        src={sideSrc}
        alt={`${item.role} side view`}
        className="w-full h-full block drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] pointer-events-none"
        draggable={false}
      />
    </div>
  );
}
