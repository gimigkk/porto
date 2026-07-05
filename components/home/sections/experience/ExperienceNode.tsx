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

  // Dot size ranges from 8px to 40px based on impressiveness (1-10)
  const dotSize = 8 + ((item.impressiveness - 1) / 9) * 32;

  // Pole length ranges from 48px to 144px based on impressiveness
  const poleHeight = 48 + ((item.impressiveness - 1) / 9) * 96;

  // Calculate distance from dot center to separator center
  // poleHeight + 12px (gap) + 24px (half of 48px separator)
  const translateDistance = 36 + poleHeight;

  return (
    <motion.div
      className="w-full md:w-max md:h-[500px] flex-shrink-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* DESKTOP LAYOUT (Dynamic Flex-Stretch Architecture) */}
      <div className="hidden md:flex flex-row h-full w-max">
         <div 
            className={`flex flex-row items-start ${isTop ? 'self-end' : 'self-start'}`}
            style={isTop ? { marginBottom: `${250 + poleHeight + 12}px` } : { marginTop: `${250 + poleHeight + 12}px` }}
         >
            {/* Dates Column */}
            <div className="flex flex-col text-base font-medium tracking-wide text-neutral-500 dark:text-neutral-400 text-right pr-3 pt-[3px]">
               <span>{item.startDate}</span>
               <span>{item.endDate}</span>
            </div>

            {/* Dynamic Separator, Pole, and Dot */}
            <div className="relative w-[2px] bg-neutral-300 dark:bg-neutral-700 self-stretch">
               {/* The Pole (with 12px gap from separator) */}
               {isTop ? (
                  <div className="absolute left-0 w-full bg-neutral-300 dark:bg-neutral-700 -z-10" style={{ top: 'calc(100% + 12px)', height: `${poleHeight}px` }} />
               ) : (
                  <div className="absolute left-0 w-full bg-neutral-300 dark:bg-neutral-700 -z-10" style={{ bottom: 'calc(100% + 12px)', height: `${poleHeight}px` }} />
               )}

               {/* The Dot */}
               <div 
                  className="absolute left-1/2 bg-neutral-900 dark:bg-white rounded-full z-10"
                  style={{ 
                     width: `${dotSize}px`, height: `${dotSize}px`,
                     ...(isTop 
                        ? { top: `calc(100% + ${poleHeight + 12}px)`, transform: 'translate(-50%, -50%)' }
                        : { bottom: `calc(100% + ${poleHeight + 12}px)`, transform: 'translate(-50%, 50%)' }
                     )
                  }}
               />
            </div>

            {/* Role Column */}
            <div className="flex flex-col text-left pl-3">
               <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight max-w-[200px]" style={{ textWrap: 'balance' }}>
                  {item.role}
               </h3>
               <p className="text-base text-neutral-600 dark:text-neutral-400 font-medium mt-1 max-w-[200px]" style={{ textWrap: 'balance' }}>
                  {item.company}
               </p>
            </div>
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
          <div className="absolute top-1/2 left-1/2 w-8 h-[2px] bg-neutral-300 dark:bg-neutral-700 -translate-y-1/2 -z-10" />
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
