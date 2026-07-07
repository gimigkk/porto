"use client";

import { motion } from "framer-motion";
import { ExperienceItem } from "@/types/experience";
import { useTooltip } from "@/components/providers/TooltipProvider";
import { ExperienceTooltipContent } from "./ExperienceTooltipContent";

interface Props {
  item: ExperienceItem;
  index: number;
  total: number;
  isTopNodeVisual?: boolean;
}

export function ExperienceNode({ item, index, total, isTopNodeVisual }: Props) {
  const { showTooltip, hideTooltip } = useTooltip();
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
      className="w-full md:w-max md:h-[500px] flex-shrink-0 relative pointer-events-none"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{ zIndex: total - index }}
    >
      {/* DESKTOP LAYOUT (Dynamic Flex-Stretch Architecture) */}
      <div className="hidden md:flex flex-row h-full w-max">
         <div 
            className={`flex flex-row items-start ${isTop ? 'self-end' : 'self-start'} relative p-2 -m-2 cursor-default rounded-xl pointer-events-auto`}
            style={isTop ? { marginBottom: `${250 + poleHeight + 12 - 8}px` } : { marginTop: `${250 + poleHeight + 12 - 8}px` }}
            onMouseEnter={() => showTooltip(<ExperienceTooltipContent item={item} />)}
            onMouseLeave={hideTooltip}
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
                  <div className="absolute left-0 w-full bg-neutral-300 dark:bg-neutral-700 -z-10 pointer-events-none" style={{ top: 'calc(100% + 12px)', height: `${poleHeight}px` }} />
               ) : (
                  <div className="absolute left-0 w-full bg-neutral-300 dark:bg-neutral-700 -z-10 pointer-events-none" style={{ bottom: 'calc(100% + 12px)', height: `${poleHeight}px` }} />
               )}

               {/* The Dot */}
               <div 
                  className="absolute left-1/2 bg-neutral-900 dark:bg-white rounded-full z-10 pointer-events-none"
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

      {/* MOBILE LAYOUT (Grid Architecture) */}
      <div 
        className="md:hidden grid relative" 
        style={{ 
          gridTemplateColumns: `32px ${12 + ((item.impressiveness - 1) / 9) * 48}px 12px auto 1fr`,
          alignItems: 'center'
        }}
      >
        {/* Row 1: Role */}
        <div className="col-start-4 col-end-5 row-start-1 row-end-2 pb-1.5 flex items-end">
          <h3 className="text-[14px] font-bold text-neutral-900 dark:text-white leading-tight">
            {item.roleMobile || item.role}
          </h3>
        </div>

        {/* Row 2: Dot, Pole, Gap, Separator */}
        {/* Mobile Vertical Timeline Line Segment is now handled by a single line in ExperienceSection.tsx to prevent overlapping dots */}
        <div className="col-start-1 col-end-2 row-start-2 row-end-3 flex justify-center w-full h-[2px] z-0 relative">
        </div>

        {/* Dynamic Pole (spans Col 1 & 2, width is 100% - 16px to start exactly at dot center) */}
        <div className="col-start-1 col-end-3 row-start-2 row-end-3 flex justify-end items-center h-[2px] w-full z-0 relative">
           <div className="h-full bg-neutral-200 dark:bg-neutral-800 w-[calc(100%-16px)]" />
        </div>

        {/* Dot container */}
        <div className="col-start-1 col-end-2 row-start-2 row-end-3 flex items-center justify-center relative w-8 h-[2px] z-10">
          <div
            className="bg-neutral-900 dark:bg-white rounded-full flex-shrink-0 absolute"
            style={{ 
              width: `${10 + ((item.impressiveness - 1) / 9) * 8}px`, 
              height: `${10 + ((item.impressiveness - 1) / 9) * 8}px` 
            }}
          />
        </div>
        
        {/* Col 3 is the 12px gap, left empty */}

        {/* Separator matches text width */}
        <div className="col-start-4 col-end-5 row-start-2 row-end-3 h-[2px] bg-neutral-200 dark:bg-neutral-800 w-full" />

        {/* Row 3: Org & Dates */}
        <div className="col-start-4 col-end-5 row-start-3 row-end-4 pt-1.5 flex flex-col justify-start">
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium leading-tight">
            {item.companyMobile || item.company}
          </p>
          <div className="text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-500 flex flex-wrap gap-x-2 items-center mt-0.5">
            <span>{item.startDate}</span>
            <span>to</span>
            <span>{item.endDate}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
