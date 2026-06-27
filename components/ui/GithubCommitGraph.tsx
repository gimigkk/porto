"use client";

import type { GithubGraphDay } from "@/lib/github";
import { useRef, useMemo } from "react";
import { useInView } from "framer-motion";

export default function GithubCommitGraph({ data, delayBase = 0, trigger }: { data: GithubGraphDay[][], delayBase?: number, trigger?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const internalInView = useInView(ref, { once: true, margin: "-50px" });
  const isInView = trigger !== undefined ? trigger : internalInView;
  // Mathematical linear curve mapper and Month Labels cached via useMemo
  const { maxLinear, monthLabels } = useMemo(() => {
    // 1. Calculate Mean & StdDev
    const flatCounts = data.flat().map(d => d.count).filter(c => c > 0);
    let maxL = 10;
    if (flatCounts.length > 0) {
      const sum = flatCounts.reduce((a, b) => a + b, 0);
      const mean = sum / flatCounts.length;
      const squareDiffs = flatCounts.map(c => Math.pow(c - mean, 2));
      const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length);
      maxL = Math.max(Math.ceil(mean + 1.5 * stdDev), 1);
    }

    // 2. Compute accurate month labels
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels: { name: string, colIndex: number }[] = [];
    let currentMonth = -1;

    data.forEach((week, colIndex) => {
      const dayWithDate = week.find(d => !!d.date);
      if (!dayWithDate) return;

      const parts = dayWithDate.date.split("-");
      if (parts.length < 3) return;
      const monthIndex = parseInt(parts[1], 10) - 1;

      if (monthIndex !== currentMonth) {
        const lastLabel = labels[labels.length - 1];
        const isDistantEnough = !lastLabel || (colIndex - lastLabel.colIndex >= 3);

        if (colIndex < data.length - 2) {
          if (isDistantEnough) {
            labels.push({ name: monthNames[monthIndex], colIndex });
          } else if (labels.length === 1) {
            labels[0] = { name: monthNames[monthIndex], colIndex };
          }
        }
        currentMonth = monthIndex;
      }
    });

    return { maxLinear: maxL, monthLabels: labels };
  }, [data]);

  const getDayStyle = (count: number) => {
    if (count === 0) return { backgroundColor: "rgba(24, 24, 27, 0.5)" }; // zinc-900/50
    const ratio = Math.min(count / maxLinear, 1);
    const opacity = 0.05 + (ratio * 0.9);
    return { backgroundColor: `rgba(228, 228, 231, ${opacity})` }; // zinc-200 base
  };

  return (
    <div className="flex flex-col items-end w-max" ref={ref}>
      <div className="relative w-full h-3 md:h-4 text-zinc-400 text-[9px] md:text-[11px] mb-1 px-1">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="absolute top-0"
            style={{
              left: `calc(${(m.colIndex / data.length) * 100}%)`,
              opacity: isInView ? 1 : 0,
              transition: `opacity 0.5s ease-out ${delayBase + 0.4}s`
            }}
          >
            {m.name}
          </span>
        ))}
      </div>
      <div className="flex gap-[2px] md:gap-[3px]">
        {data.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-[2px] md:gap-[3px]">
            {week.map((day, dIndex) => (
              <div
                key={dIndex}
                className="group relative w-[8px] h-[8px] md:w-[12px] md:h-[12px] rounded-[1px] md:rounded-[2px]"
                style={{
                  ...getDayStyle(day.count),
                  transform: isInView ? "scale(1)" : "scale(0)",
                  transition: `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${delayBase + ((data.length - 1 - wIndex) * 0.015) + ((6 - dIndex) * 0.015)}s`
                }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-zinc-700/95 text-zinc-100 text-[11px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {day.text}
                  {/* Tooltip triangle indicator */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-zinc-700/95" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
