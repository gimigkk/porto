"use client";

import { useState, useEffect } from "react";
import { ReactLenis } from "lenis/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LenisProvider({ children }: { children: any }) {
  const [isClient, setIsClient] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
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
    <ReactLenis root options={{ lerp: 0.15, duration: 0.7, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
