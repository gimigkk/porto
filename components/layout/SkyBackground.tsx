"use client";

import { useParallaxDock } from "@/hooks/useParallaxDock";
import AsciiClouds from "@/components/AsciiClouds/AsciiClouds";
import type { PreloadedAssets } from "@/hooks/usePreloader";

interface SkyBackgroundProps {
  isReady?: boolean;
  preloadedAssets?: PreloadedAssets | null;
  onIntroComplete?: () => void;
}

export default function SkyBackground({ isReady, preloadedAssets, onIntroComplete }: SkyBackgroundProps) {
  const { parallaxRef } = useParallaxDock({
    dockAnchor: "#section-experience",
    target: "#home",
    visibleFrac: 0.3,
    startSpeed: 1,
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-0 overflow-hidden pointer-events-none select-none" style={{ height: "var(--hero-height, 95svh)" }}>
      {/* Parallax container — gradient + clouds move together */}
      <div
        ref={parallaxRef}
        className="absolute inset-0"
        style={{ willChange: "transform" }}
      >
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-[#0c3888] to-[#50aaff]" />

        {/* ASCII Clouds */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <AsciiClouds
            className="w-full h-full"
            isReady={isReady}
            preloadedAssets={preloadedAssets}
            onIntroComplete={onIntroComplete}
          />
        </div>
      </div>
    </div>
  );
}