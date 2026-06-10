"use client";

import { useEffect, useCallback, useRef } from "react";

interface LoadingScreenProps {
  isReady: boolean;
  /** Fade-out duration (ms). Default 400. */
  fadeOutMs?: number;
  /** Called when fade-out completes and screen can be unmounted */
  onComplete: () => void;
}

/**
 * Controls the SSR-rendered #ssr-loading-screen element in layout.tsx.
 * 
 * The loading screen is already visible as pure HTML from the initial server render.
 * This component only handles fading it out and removing it once assets are ready.
 * Renders no DOM of its own.
 */
export default function LoadingScreen({
  isReady,
  fadeOutMs = 400,
  onComplete,
}: LoadingScreenProps) {
  const removedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (removedRef.current) return;
    removedRef.current = true;

    const el = document.getElementById("ssr-loading-screen");
    if (!el) {
      onComplete();
      return;
    }

    // Fade out — keep element in DOM for React reconciler
    el.style.opacity = "0";
    el.style.pointerEvents = "none";

    // Signal complete after transition — keep element in DOM
    // (removing it confuses React hydration reconciler)
    setTimeout(() => {
      onComplete();
    }, fadeOutMs);
  }, [fadeOutMs, onComplete]);

  useEffect(() => {
    if (isReady) {
      dismiss();
    }
  }, [isReady, dismiss]);

  // Renders nothing — the SSR element in layout.tsx is the visual loading screen
  return null;
}
