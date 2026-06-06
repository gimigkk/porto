/**
 * AsciiClouds.tsx
 * 
 * Entry point for the ASCII Cloud animation. 
 * This component renders a canvas and delegates the animation logic
 * to the `useAsciiClouds` hook.
 */
"use client";

import { useAsciiClouds } from "./useAsciiClouds";

export default function AsciiClouds({ className = "" }: { className?: string }) {
  const canvasRef = useAsciiClouds();

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
    />
  );
}