"use client";

import { useEffect } from "react";
import { useLenis } from "@studio-freight/react-lenis";

export default function AutoScroller({ target }: { target: string }) {
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      // Small delay to ensure DOM is ready and Lenis is fully initialized
      setTimeout(() => {
        lenis.scrollTo(target, { immediate: true });
      }, 50);
    }
  }, [lenis, target]);

  return null;
}
