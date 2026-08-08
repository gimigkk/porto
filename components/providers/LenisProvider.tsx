"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { VirtualScrollData } from "lenis";
import { ReactLenis, type LenisRef } from "lenis/react";

export default function LenisProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    setIsFirefox(navigator.userAgent.includes("Firefox"));

    const disableSpaceScroll = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', disableSpaceScroll);
    return () => window.removeEventListener('keydown', disableSpaceScroll);
  }, []);

  // Server & first hydration render: always wrap with Lenis to match.
  // After mount: skip on Firefox to free main thread.
  if (isClient && isFirefox) return <>{children}</>;

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.15,
        duration: 0.7,
        smoothWheel: true,
        virtualScroll: handleVirtualScroll,
      }}
    >
      {children}
    </ReactLenis>
  );
}
