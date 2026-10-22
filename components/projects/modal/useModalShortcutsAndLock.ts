"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";

export function useModalShortcutsAndLock(
  isAnimating: boolean,
  onClose: () => void
) {
  const lenis = useLenis();

  // Lock/unlock body scroll
  useEffect(() => {
    if (isAnimating) {
      if (lenis) lenis.stop();
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (lenis) lenis.start();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isAnimating, lenis]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);
}
