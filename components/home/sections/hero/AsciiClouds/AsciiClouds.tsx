/**
 * AsciiClouds.tsx
 * 
 * Entry point for the ASCII Cloud animation. 
 * This component renders a canvas and delegates the animation logic
 * to the `useAsciiClouds` hook.
 */
"use client";

import { useAsciiClouds } from "./useAsciiClouds";
import type { PreloadedAssets } from "@/hooks/usePreloader";

interface AsciiCloudsProps {
  className?: string;
  isReady?: boolean;
  preloadedAssets?: PreloadedAssets | null;
  /** Fired once when the intro zoom/slide animation completes */
  onIntroComplete?: () => void;
  /** Fired once the first canvas frame is fully drawn */
  onFirstFrameRendered?: () => void;
  progressRef?: React.MutableRefObject<number>;
}

export default function AsciiClouds({ className = "", isReady, preloadedAssets, onIntroComplete, onFirstFrameRendered, progressRef }: AsciiCloudsProps) {
  const canvasRef = useAsciiClouds({ isReady, preloadedAssets, onIntroComplete, onFirstFrameRendered, progressRef });
  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={className}
        style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
      />
    </div>
  );
}