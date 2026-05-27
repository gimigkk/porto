"use client";

import { ReactLenis } from "@studio-freight/react-lenis";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LenisProvider({ children }: { children: any }) {
  return (
    <ReactLenis root options={{ lerp: 0.3, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
