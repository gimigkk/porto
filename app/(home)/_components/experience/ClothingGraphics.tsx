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
export const ClothingFrontView = React.memo(function ClothingFrontView({
  item,
  className = "",
}: GraphicProps) {
  const frontSrc = item.frontImage || "/experience/shirt-front.webp";

  return (
    <div
      className={`relative w-full h-[279px] flex flex-col items-center select-none pointer-events-none ${className}`}
    >
      <img
        src={frontSrc}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain object-top block drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] pointer-events-none will-change-transform"
        draggable={false}
      />
    </div>
  );
});

/**
 * Side view of clothing on wooden hanger
 * Dimensions match source aspect ratio (288x1382 -> 58x278)
 * Scale is 1:1 identical to front view.
 */
interface SideGraphicProps {
  item: ExperienceItem;
  className?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

export const ClothingSideView = React.memo(function ClothingSideView({
  item,
  className = "",
  isFirst = false,
  isLast = false,
}: SideGraphicProps) {
  const sideSrc = item.sideImage || "/experience/shirt-side.webp";

  const horizontalOcclusionGradient = React.useMemo(() => {
    return !isFirst && !isLast
      ? "linear-gradient(90deg, rgba(0, 0, 0, 0.54) 0%, rgba(0, 0, 0, 0.22) 18%, transparent 35%, transparent 65%, rgba(0, 0, 0, 0.22) 82%, rgba(0, 0, 0, 0.54) 100%)"
      : isFirst
      ? "linear-gradient(90deg, transparent 0%, transparent 65%, rgba(0, 0, 0, 0.22) 82%, rgba(0, 0, 0, 0.54) 100%)"
      : "linear-gradient(90deg, rgba(0, 0, 0, 0.54) 0%, rgba(0, 0, 0, 0.22) 18%, transparent 35%, transparent 100%)";
  }, [isFirst, isLast]);

  return (
    <div
      className={`relative w-full h-[278px] flex flex-col items-center select-none pointer-events-none group/side ${className}`}
    >
      <img
        src={sideSrc}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain object-top block drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] pointer-events-none will-change-transform"
        draggable={false}
      />
      {/* Inter-Garment Cavity Occlusion: natural flank shadowing between neighbors */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 [@media(hover:hover)]:group-hover/side:opacity-40"
        style={{
          background: horizontalOcclusionGradient,
          WebkitMaskImage: `url(${sideSrc})`,
          maskImage: `url(${sideSrc})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "top center",
          maskPosition: "top center",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );
});
