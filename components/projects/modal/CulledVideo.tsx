"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

export default function CulledVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "200px" });

  return (
    <div ref={ref} className={className}>
      {isInView && (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          controls
          onCanPlay={(event) => {
            event.currentTarget.playbackRate = 1.5;
          }}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
