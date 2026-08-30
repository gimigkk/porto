"use client";

import { useEffect, useState } from "react";
import JumpingDots from "@/components/shared/JumpingDots";

interface LoadingScreenProps {
  isReady: boolean;
  /** Fade-out duration (ms). Default 400. */
  fadeOutMs?: number;
  /** Called when fade-out completes and screen can be unmounted */
  onComplete: () => void;
}

export default function LoadingScreen({
  isReady,
  fadeOutMs = 400,
  onComplete,
}: LoadingScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Hide SSR fallback if present in initial document
    const el = document.getElementById("ssr-loading-screen");
    if (el) el.style.display = "none";
  }, []);

  useEffect(() => {
    if (isReady && !fading) {
      setFading(true);
      const t = setTimeout(() => {
        onComplete();
      }, fadeOutMs);
      return () => clearTimeout(t);
    }
  }, [isReady, fading, fadeOutMs, onComplete]);

  // Safety fallback: ensure loading screen never locks the UI if ready events stall
  useEffect(() => {
    const safety = setTimeout(() => {
      setFading(true);
      const t = setTimeout(() => {
        onComplete();
      }, fadeOutMs);
      return () => clearTimeout(t);
    }, 1000);
    return () => clearTimeout(safety);
  }, [fadeOutMs, onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #0c3888, #50aaff)",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
        transition: `opacity ${fadeOutMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
      aria-hidden="true"
    >
      <JumpingDots />
    </div>
  );
}
