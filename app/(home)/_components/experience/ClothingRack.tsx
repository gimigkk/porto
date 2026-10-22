"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { ExperienceItem } from "@/types/experience";
import { ClothingItem } from "./ClothingItem";
import { getEqualGappedTargets } from "./clothingLayout";

interface ClothingRackProps {
  items: ExperienceItem[];
  selectedIndex: number;
  onSelect: (item: ExperienceItem, index: number) => void;
}

export function ClothingRack({
  items,
  selectedIndex,
  onSelect,
}: ClothingRackProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [railWidth, setRailWidth] = useState(720);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          const w = entry.contentRect.width;
          const isDesktop = window.innerWidth >= 1024;
          // Desktop uses actual column width; mobile/tablet uses min 720 for comfortable spacing on horizontal scroll
          setRailWidth(isDesktop ? w : Math.max(w, 720));
        }
      }
    });
    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute strictly equal-gapped coordinates across the rail
  const targets = useMemo(
    () => getEqualGappedTargets(items.length, selectedIndex, railWidth),
    [items.length, selectedIndex, railWidth]
  );

  // Auto-scroll on selection change ONLY for mobile/tablet where rack scrolls
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Desktop: never auto-scroll horizontally (prevents layout shift on select)
    if (window.innerWidth >= 1024) {
      container.scrollLeft = 0;
      return;
    }

    const isMobile = window.innerWidth < 640;
    const scale = isMobile ? 0.62 : 0.85;

    const targetX = targets[selectedIndex] ?? 0;
    const visualX = targetX * scale;
    const targetScrollLeft = visualX - container.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: "smooth",
    });
  }, [selectedIndex, targets]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative w-full overflow-x-auto lg:overflow-visible pt-9 lg:pt-0 pb-6 lg:pb-0 scrollbar-none [touch-action:pan-x_pan-y] overscroll-x-contain"
    >
      {/* Outer wrapper sized precisely to scaled footprint:
          Mobile (0.62x): 720 * 0.62 = 446px wide, 350 * 0.62 = 217px high
          Tablet (0.85x): 720 * 0.85 = 612px wide, 350 * 0.85 = 298px high
          Desktop (1.0x): 100% wide, 410px high (accommodates 1.20x scaled garments & labels) */}
      <div className="relative mx-auto w-[446px] sm:w-[612px] lg:w-full h-[220px] sm:h-[298px] lg:h-[410px] shrink-0 overflow-visible">
        <div
          className="relative origin-top-left scale-[0.62] sm:scale-85 lg:scale-100 overflow-visible"
          style={{ width: `${railWidth}px`, height: "100%" }}
        >
          {/* Photorealistic Chrome Rail with Gradient-Faded Ends: Top aligned with left image (Y = 0px) */}
          <div
            className="absolute top-0 left-0 right-0 h-[11px] pointer-events-none z-10"
            style={{
              maskImage:
                "linear-gradient(90deg, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)",
            }}
          >
            {/* Ambient Wall Shadow Cast Under Cylinder */}
            <div className="absolute -bottom-3 left-0 right-0 h-4 bg-black/60 blur-md pointer-events-none" />

            {/* Solid Polished Chrome Rail with Realistic Metallic Anisotropy */}
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, #27272a 0%, #ffffff 28%, #d4d4d8 42%, #18181b 68%, #52525b 88%, #09090b 100%)",
                boxShadow:
                  "inset 0 1px 0.5px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(0, 0, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.5)",
              }}
            />
          </div>

          {/* Hanger Items Stage */}
          <div className="relative w-full h-full overflow-visible">
            {items.map((item, index) => (
              <ClothingItem
                key={item.id}
                item={item}
                index={index}
                isSelected={index === selectedIndex}
                targetX={targets[index] ?? 0}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
