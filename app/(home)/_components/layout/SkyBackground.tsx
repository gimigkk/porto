"use client";

import { useParallaxDock } from "@/app/(home)/_components/hooks/useParallaxDock";
import AsciiClouds from "@/app/(home)/_components/hero/AsciiClouds/AsciiClouds";
import { CONFIG } from "@/app/(home)/_components/hero/AsciiClouds/CloudAsciiCore";
import type { PreloadedAssets } from "@/app/(home)/_components/hooks/usePreloader";
const SKY_LAYOUT_OBSERVERS = ["#home", "#stacked-sections"] as const;

interface SkyBackgroundProps {
  isReady?: boolean;
  preloadedAssets?: PreloadedAssets | null;
  onIntroComplete?: () => void;
  onFirstFrameRendered?: () => void;
  heroHeight?: string;
  isMobile?: boolean;
  isRevisit?: boolean;
}

export default function SkyBackground({
  isReady,
  preloadedAssets,
  onIntroComplete,
  onFirstFrameRendered,
  heroHeight = "100svh",
  isMobile = false,
  isRevisit = false,
}: SkyBackgroundProps) {
  const { parallaxRef, progressRef } = useParallaxDock({
    dockAnchor: '[data-folder-root="section-about"]',
    target: "#home",
    speed: 0.75,
    disabled: isMobile,
    observeSelectors: SKY_LAYOUT_OBSERVERS,
  });

  return (
    <div
      className={`${isMobile ? 'absolute inset-0' : 'fixed top-0 left-0 right-0'} z-0 pointer-events-none select-none`}
      style={isMobile ? undefined : {
        height: heroHeight,
        transition: isRevisit ? "none" : "height 600ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Parallax container — gradient + clouds move together */}
      <div
        ref={parallaxRef}
        className="absolute inset-0"
        style={{ willChange: "transform", transform: "translateZ(0)" }}
      >
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-[#1F2484] to-[#50aaff]" />
        {/* Overscroll bleed cover to prevent black flash on low FPS */}
        <div className="absolute top-full left-0 right-0 h-[100vh] bg-black" />

        {/* ASCII Clouds */}
        <div
          className="absolute inset-0 pointer-events-none select-none"
          style={{ opacity: CONFIG.opacity }}
        >
          <AsciiClouds
            className="w-full h-full"
            isReady={isReady}
            preloadedAssets={preloadedAssets}
            onIntroComplete={onIntroComplete}
            onFirstFrameRendered={onFirstFrameRendered}
            progressRef={progressRef}
          />
        </div>
      </div>
    </div>
  );
}
