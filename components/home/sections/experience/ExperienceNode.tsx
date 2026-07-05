"use client";

import { motion } from "framer-motion";
import { ExperienceItem } from "@/types/experience";

interface Props {
  item: ExperienceItem;
  index: number;
  total: number;
}

export function ExperienceNode({ item, index, total }: Props) {
  const isTop = index % 2 === 0;

  // Dot size ranges from 12px to 32px based on impressiveness (1-10)
  const dotSize = 12 + ((item.impressiveness - 1) / 9) * 20;

  return (
    <motion.div
      className="w-full md:w-max md:h-[400px] flex-shrink-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* DESKTOP LAYOUT (Fitted Bounding Box: Dates | Dot | Role) */}
      <div className="hidden md:flex flex-row items-center gap-4 h-full w-max">
        {/* Dates Column */}
        <div
          className={`flex flex-col text-base font-medium tracking-wide text-neutral-500 dark:text-neutral-400 text-right whitespace-nowrap
            ${isTop ? "-translate-y-[76px]" : "translate-y-[76px]"}
          `}
        >
          <span>{item.startDate}</span>
          <span>{item.endDate}</span>
        </div>

        {/* Center Column: Dot, Flag Pole, and Separator */}
        <div className="relative w-8 h-full flex-none">
          {/* The Dot */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 dark:bg-white rounded-full z-10"
            style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
          />

          {/* Top/Bottom Stack */}
          {isTop ? (
            <div className="absolute bottom-[calc(50%+16px)] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-[2px] h-12 bg-neutral-300 dark:bg-neutral-700" />
              <div className="w-[2px] h-3 bg-transparent" />
              <div className="w-[2px] h-6 bg-neutral-300 dark:bg-neutral-700" />
            </div>
          ) : (
            <div className="absolute top-[calc(50%+16px)] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-[2px] h-6 bg-neutral-300 dark:bg-neutral-700" />
              <div className="w-[2px] h-3 bg-transparent" />
              <div className="w-[2px] h-12 bg-neutral-300 dark:bg-neutral-700" />
            </div>
          )}
        </div>

        {/* Role Column */}
        <div
          className={`flex flex-col text-left whitespace-nowrap
            ${isTop ? "-translate-y-[76px]" : "translate-y-[76px]"}
          `}
        >
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
            {item.role}
          </h3>
          <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium mt-1">
            {item.company}
          </p>
        </div>
      </div>

      {/* MOBILE LAYOUT (Normal flow, horizontal stacking) */}
      <div className="flex md:hidden flex-row items-center w-full gap-4 pt-4 pb-8 pl-4 relative">
        {/* Dot container aligns with vertical line at left-8 (32px) */}
        <div className="flex-none flex items-center justify-center relative w-8 h-8">
          <div
            className="bg-neutral-900 dark:bg-white rounded-full z-10"
            style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
          />
          {/* Horizontal flag pole connecting to separator */}
          <div className="absolute top-1/2 left-[calc(50%+4px)] w-4 h-[2px] bg-neutral-300 dark:bg-neutral-700 -translate-y-1/2" />
        </div>

        {/* Dates */}
        <div className="flex-none flex flex-col text-sm font-medium tracking-wide text-neutral-500 dark:text-neutral-400 text-right whitespace-nowrap">
          <span>{item.startDate}</span>
          <span>{item.endDate}</span>
        </div>

        {/* Separator */}
        <div className="flex-none w-[2px] h-12 bg-neutral-300 dark:bg-neutral-700" />

        {/* Role */}
        <div className="flex-1 flex flex-col text-left">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
            {item.role}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium mt-1">
            {item.company}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
