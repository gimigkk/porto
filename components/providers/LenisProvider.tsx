"use client";

import { useCallback, useRef, type ReactNode } from "react";
import type { VirtualScrollData } from "lenis";
import { ReactLenis, type LenisRef } from "lenis/react";

export default function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  const handleVirtualScroll = useCallback(({ deltaY, event }: VirtualScrollData): boolean => {
    if (event.type !== "wheel" || deltaY === 0) return true;

    const lenis = lenisRef.current?.lenis;
    if (!lenis || lenis.isStopped || lenis.isLocked) return true;

    const pendingDelta = lenis.targetScroll - lenis.animatedScroll;
    if (pendingDelta !== 0 && Math.sign(deltaY) !== Math.sign(pendingDelta)) {
      // Drop old-direction momentum; Lenis still smooths this wheel delta.
      lenis.scrollTo(lenis.actualScroll, { immediate: true });
    }

    return true;
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.1,
        smoothWheel: true,
        virtualScroll: handleVirtualScroll,
      }}
    >
      {children}
    </ReactLenis>
  );
}
