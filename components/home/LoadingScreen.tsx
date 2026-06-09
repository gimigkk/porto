"use client";

import { useState, useEffect, useCallback } from "react";

interface LoadingScreenProps {
  isReady: boolean;
  /** Debounce delay before showing loader (ms). Default 300. */
  debounceMs?: number;
  /** Fade-out duration (ms). Default 400. */
  fadeOutMs?: number;
  /** Called when fade-out completes and screen can be unmounted */
  onComplete: () => void;
}

/**
 * Debounced loading screen with 3 jumping dots.
 * 
 * Flow:
 *   LOADING → (debounce 300ms) → SHOW_LOADER → (ready) → FADE_OUT → DONE
 *   LOADING → (ready before 300ms) → DONE (never shown)
 */
export default function LoadingScreen({
  isReady,
  debounceMs = 0,
  fadeOutMs = 400,
  onComplete,
}: LoadingScreenProps) {
  const [showLoader, setShowLoader] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Debounce: only show if loading takes longer than threshold
  useEffect(() => {
    if (isReady) return; // Already loaded, skip

    const timer = setTimeout(() => {
      setShowLoader(true);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [isReady, debounceMs]);

  // When ready: either fade out (if visible) or complete immediately
  useEffect(() => {
    if (!isReady) return;

    if (showLoader) {
      // Loader is visible — fade it out
      setFadeOut(true);
    } else {
      // Loader was never shown — complete immediately
      onComplete();
    }
  }, [isReady, showLoader, onComplete]);

  // After fade-out transition ends, signal complete
  const handleTransitionEnd = useCallback(() => {
    if (fadeOut) {
      onComplete();
    }
  }, [fadeOut, onComplete]);

  // Not shown yet and already ready — render nothing
  if (!showLoader && isReady) return null;
  // Not shown yet and still loading — render invisible blocker to prevent flash
  if (!showLoader && !isReady) {
    return (
      <div
        className="fixed inset-0 z-[999] bg-gradient-to-b from-[#0c3888] to-[#50aaff]"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-gradient-to-b from-[#0c3888] to-[#50aaff]"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: `opacity ${fadeOutMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden="true"
    >
      {/* Three jumping dots */}
      <div className="flex items-center gap-[6px]" style={{ animation: "dotsFadeIn 0.2s ease-out forwards" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loading-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              display: "block",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        .loading-dot {
          animation: dotJump 0.8s infinite, dotFade 0.8s infinite;
        }

        @keyframes dotJump {
          0%, 100% {
            transform: translateY(0);
            animation-timing-function: ease-out;
          }
          50% {
            transform: translateY(-12px);
            animation-timing-function: ease-in;
          }
        }

        @keyframes dotFade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }

        @keyframes dotsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
