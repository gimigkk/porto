"use client";

import { useParallaxDock } from "@/hooks/useParallaxDock";
import dynamic from "next/dynamic";
import type { PreloadedAssets } from "@/hooks/usePreloader";

const AsciiClouds = dynamic(() => import("@/components/home/sections/hero/AsciiClouds/AsciiClouds"), { ssr: false });

interface SkyBackgroundProps {
  isReady?: boolean;
  preloadedAssets?: PreloadedAssets | null;
  onIntroComplete?: () => void;
  onFirstFrameRendered?: () => void;
  heroHeight?: string;
  isMobile?: boolean;
}

export default function SkyBackground({ isReady, preloadedAssets, onIntroComplete, onFirstFrameRendered, heroHeight = "100svh", isMobile = false }: SkyBackgroundProps) {
  const { parallaxRef, progressRef } = useParallaxDock({
    dockAnchor: "#section-experience",
    target: "#home",
    visibleFrac: 0.3,
    startSpeed: 1,
    disabled: isMobile,
  });

  return (
    <div
      className={`${isMobile ? 'absolute inset-0' : 'fixed top-0 left-0 right-0'} z-0 pointer-events-none select-none`}
      style={isMobile ? undefined : {
        height: heroHeight,
        transition: "height 600ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Parallax container — gradient + clouds move together */}
      <div
        ref={parallaxRef}
        className="absolute inset-0"
        style={{ willChange: "transform" }}
      >
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-[#0c3888] to-[#50aaff]" />
        {/* Overscroll bleed cover to prevent black flash on low FPS */}
        <div className="absolute top-full left-0 right-0 h-[100vh] bg-black" />

        {/* ASCII Clouds */}
        <div className="absolute inset-0 pointer-events-none select-none">
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