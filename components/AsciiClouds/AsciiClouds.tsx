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
}

export default function AsciiClouds({ className = "", isReady, preloadedAssets }: AsciiCloudsProps) {
  const canvasRef = useAsciiClouds({ isReady, preloadedAssets });

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
    />
  );
}