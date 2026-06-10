"use client";

import { useState, useEffect } from "react";
import { ReactLenis } from "lenis/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LenisProvider({ children }: { children: any }) {
  const [isClient, setIsClient] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
  useEffect(() => {
    setIsClient(true);
    setIsFirefox(navigator.userAgent.includes("Firefox"));
  }, []);

  // Server & first hydration render: always wrap with Lenis to match.
  // After mount: skip on Firefox to free main thread.
  if (isClient && isFirefox) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.3, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
