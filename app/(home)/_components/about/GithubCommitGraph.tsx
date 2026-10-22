"use client";

import type { GithubGraphDay } from "@/lib/github";
import React, { useRef, useMemo } from "react";
import { useInView } from "framer-motion";
import { useTooltip } from "@/components/providers/TooltipProvider";
import { GithubTooltipContent } from "./tooltips/GithubTooltipContent";

export default React.memo(function GithubCommitGraph({ data, delayBase = 0, trigger }: { data: GithubGraphDay[][], delayBase?: number, trigger?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const internalInView = useInView(ref, { once: true, amount: 0.2 });
  const isInView = trigger !== undefined ? trigger : internalInView;
  const { showTooltip, hideTooltip } = useTooltip();
  
  // Linear scale calculation and Month Labels cached via useMemo
  const { maxLinear, monthLabels } = useMemo(() => {
    let count = 0;
    let sum = 0;
    let sumSq = 0;

    for (let c = 0; c < data.length; c++) {
      const week = data[c];
      for (let r = 0; r < week.length; r++) {
        const val = week[r].count;
        if (val > 0) {
          count++;
          sum += val;
          sumSq += val * val;
        }
      }
    }

    let maxL = 10;
    if (count > 0) {
      const mean = sum / count;
      const variance = Math.max(0, (sumSq / count) - (mean * mean));
      const stdDev = Math.sqrt(variance);
      maxL = Math.max(Math.ceil(mean + 1.5 * stdDev), 1);
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels: { name: string; colIndex: number }[] = [];
    let currentMonth = -1;

    for (let colIndex = 0; colIndex < data.length; colIndex++) {
      const week = data[colIndex];
      for (let dayIndex = 0; dayIndex < week.length; dayIndex++) {
        const date = week[dayIndex]?.date;
        if (!date) continue;
        const parts = date.split("-");
        if (parts.length < 3) continue;
        const monthIndex = parseInt(parts[1], 10) - 1;

        if (monthIndex !== currentMonth) {
          const lastLabel = labels[labels.length - 1];
          const isDistantEnough = !lastLabel || (colIndex - lastLabel.colIndex >= 3);
          if (isDistantEnough) {
            labels.push({ name: monthNames[monthIndex], colIndex });
          } else if (labels.length === 1) {
            labels[0] = { name: monthNames[monthIndex], colIndex };
          }
          currentMonth = monthIndex;
        }
        break;
      }
    }

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
              transition: isInView ? `opacity 0.5s ease-out ${delayBase + 0.4}s` : "none"
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
                className="w-[8px] h-[8px] md:w-[12px] md:h-[12px] rounded-[1px] md:rounded-[2px] cursor-default pointer-events-auto"
                style={{
                  ...getDayStyle(day.count),
                  transform: isInView ? "scale(1)" : "scale(0)",
                  transition: isInView ? `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${delayBase + ((data.length - 1 - wIndex) * 0.015) + ((6 - dIndex) * 0.015)}s` : "none"
                }}
                onMouseEnter={() => showTooltip(<GithubTooltipContent text={day.text} />)}
                onMouseLeave={hideTooltip}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
