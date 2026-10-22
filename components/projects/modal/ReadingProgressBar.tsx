"use client";

import { useEffect, useRef } from "react";

export default function ReadingProgressBar({
  scrollRef,
  accent,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  accent: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const max = el.scrollHeight - el.clientHeight;
          const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((el.scrollTop / max) * 100))) : 0;
          if (barRef.current) barRef.current.style.width = `${pct}%`;
          if (textRef.current) textRef.current.textContent = `${pct}%`;
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-md bg-zinc-900/50 border border-zinc-800">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-zinc-500 uppercase tracking-wider">Progress</span>
        <span ref={textRef} className="text-zinc-300 font-medium">
          0%
        </span>
      </div>
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full transition-all duration-75"
          style={{ width: "0%", backgroundColor: accent }}
        />
      </div>
    </div>
  );
}
