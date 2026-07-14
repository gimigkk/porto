"use client";

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { ExperienceItem } from "@/types/experience";
import { useTooltip } from "@/components/providers/TooltipProvider";
import { ExperienceTooltipContent } from "./ExperienceTooltipContent";

const SPRING_CONFIG = { type: "spring", stiffness: 100, damping: 20, duration: 0.5 } as const;
const DOT_SPRING_CONFIG = { type: "spring", stiffness: 120, damping: 15, duration: 0.5 } as const;

interface Props {
  item: ExperienceItem;
  index: number;
  total: number;
  isInView?: boolean;
}

export const ExperienceNode = React.memo(function ExperienceNode({ item, index, total, isInView }: Props) {
  const { showTooltip, hideTooltip } = useTooltip();
  const isTop = index % 2 === 0;

  // Dot size ranges from 8px to 40px based on impressiveness (1-10)
  const dotSize = 8 + ((item.impressiveness - 1) / 9) * 32;

  // Pole length ranges from 48px to 144px based on impressiveness
  const poleHeight = 48 + ((item.impressiveness - 1) / 9) * 96;
  const mobileFlagOffset = 28 + ((item.impressiveness - 1) / 9) * 48;

  const handleMouseEnter = useCallback(() => {
    showTooltip(<ExperienceTooltipContent item={item} />);
  }, [showTooltip, item]);

  const desktopDelay = index * 0.2;
  const mobileDelay = (total - 1 - index) * 0.2;

  return (
    <div
      className="w-full md:w-max md:h-[500px] flex-shrink-0 relative pointer-events-none"
      style={{ zIndex: total - index }}
    >
      {/* DESKTOP LAYOUT (Dynamic Flex-Stretch Architecture) */}
      <div 
        className="hidden md:flex flex-row h-full w-max"
      >
         <div 
            className={`flex flex-row items-start ${isTop ? 'self-end' : 'self-start'} relative p-2 -m-2 cursor-default rounded-xl pointer-events-auto`}
            style={isTop ? { marginBottom: `${250 + poleHeight + 12 - 8}px` } : { marginTop: `${250 + poleHeight + 12 - 8}px` }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={hideTooltip}
         >
            {/* Dates Column */}
             <motion.div 
               className="flex flex-col text-base font-medium tracking-wide text-neutral-500 dark:text-neutral-400 text-right pr-3 pt-[3px]"
               initial={{ y: isTop ? poleHeight + 12 : -(poleHeight + 12) }}
               animate={isInView ? { y: 0 } : { y: isTop ? poleHeight + 12 : -(poleHeight + 12) }}
               transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.1 }}
               style={{ willChange: "transform" }}
            >
               <div className="overflow-hidden">
                 <motion.div
                   initial={{ y: isTop ? "100%" : "-100%" }}
                   animate={isInView ? { y: 0 } : { y: isTop ? "100%" : "-100%" }}
                   transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.3 }}
                   style={{ willChange: "transform" }}
                 >
                   {item.startDate}
                 </motion.div>
               </div>
               <div className="overflow-hidden">
                 <motion.div
                   initial={{ y: isTop ? "100%" : "-100%" }}
                   animate={isInView ? { y: 0 } : { y: isTop ? "100%" : "-100%" }}
                   transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.4 }}
                   style={{ willChange: "transform" }}
                 >
                   {item.endDate}
                 </motion.div>
               </div>
            </motion.div>

            {/* Dynamic Separator, Pole, and Dot */}
            <div className="relative w-[2px] self-stretch">
               {/* Animated Separator Background */}
               <motion.div
                 className="absolute inset-0 bg-neutral-300 dark:bg-neutral-700 pointer-events-none"
                 style={{ originY: isTop ? 1 : 0, willChange: "transform" }}
                 initial={{ y: isTop ? poleHeight + 12 : -(poleHeight + 12), scaleY: 0 }}
                 animate={isInView ? { y: 0, scaleY: 1 } : { y: isTop ? poleHeight + 12 : -(poleHeight + 12), scaleY: 0 }}
                 transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.1 }}
               />

               {/* The Pole (with 12px gap from separator) */}
               {isTop ? (
                  <motion.div 
                    className="absolute left-0 w-full bg-neutral-300 dark:bg-neutral-700 -z-10 pointer-events-none" 
                    style={{ top: 'calc(100% + 12px)', height: `${poleHeight}px`, originY: 1, willChange: "transform" }} 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isInView ? 1 : 0 }}
                    transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.1 }}
                  />
               ) : (
                  <motion.div 
                    className="absolute left-0 w-full bg-neutral-300 dark:bg-neutral-700 -z-10 pointer-events-none" 
                    style={{ bottom: 'calc(100% + 12px)', height: `${poleHeight}px`, originY: 0, willChange: "transform" }} 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isInView ? 1 : 0 }}
                    transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.1 }}
                  />
               )}

               {/* The Dot */}
               <motion.div 
                  className="absolute left-1/2 bg-neutral-900 dark:bg-white rounded-full z-10 pointer-events-none"
                  style={{ 
                     width: `${dotSize}px`, height: `${dotSize}px`,
                     ...(isTop 
                        ? { top: `calc(100% + ${poleHeight + 12}px)` }
                        : { bottom: `calc(100% + ${poleHeight + 12}px)` }
                     ),
                     willChange: "transform"
                  }}
                  initial={{ scale: 0, x: "-50%", y: isTop ? "-50%" : "50%" }}
                  animate={{ scale: isInView ? 1 : 0, x: "-50%", y: isTop ? "-50%" : "50%" }}
                  transition={{ ...DOT_SPRING_CONFIG, delay: desktopDelay }}
               />
            </div>

            {/* Role Column */}
            <motion.div 
               className="flex flex-col text-left pl-3"
               initial={{ y: isTop ? poleHeight + 12 : -(poleHeight + 12) }}
               animate={isInView ? { y: 0 } : { y: isTop ? poleHeight + 12 : -(poleHeight + 12) }}
               transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.1 }}
               style={{ willChange: "transform" }}
            >
               <div className="overflow-hidden">
                 <motion.h3 
                   className="text-xl font-bold text-neutral-900 dark:text-white leading-tight max-w-[200px]" 
                   style={{ textWrap: 'balance', willChange: "transform" }}
                   initial={{ y: isTop ? "100%" : "-100%" }}
                   animate={isInView ? { y: 0 } : { y: isTop ? "100%" : "-100%" }}
                   transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.3 }}
                 >
                    {item.role}
                 </motion.h3>
               </div>
               <div className="overflow-hidden mt-1">
                 <motion.p 
                   className="text-base text-neutral-600 dark:text-neutral-400 font-medium max-w-[200px]" 
                   style={{ textWrap: 'balance', willChange: "transform" }}
                   initial={{ y: isTop ? "100%" : "-100%" }}
                   animate={isInView ? { y: 0 } : { y: isTop ? "100%" : "-100%" }}
                   transition={{ ...SPRING_CONFIG, delay: desktopDelay + 0.4 }}
                 >
                    {item.company}
                 </motion.p>
               </div>
            </motion.div>
         </div>
      </div>

      {/* MOBILE LAYOUT (Grid Architecture) */}
      <div 
        className="md:hidden grid relative" 
        style={{ 
          gridTemplateColumns: `32px ${12 + ((item.impressiveness - 1) / 9) * 48}px 12px auto 1fr`,
          alignItems: 'center',
        }}
      >
        {/* Row 1: Role */}
        <motion.div 
          className="col-start-4 col-end-5 row-start-1 row-end-2 pb-1.5 flex items-end"
          initial={{ x: -mobileFlagOffset }}
          animate={isInView ? { x: 0 } : { x: -mobileFlagOffset }}
          transition={{ ...SPRING_CONFIG, delay: mobileDelay + 0.1 }}
          style={{ willChange: "transform" }}
        >
          <div className="overflow-hidden">
            <motion.h3 
              className="text-[14px] font-bold text-neutral-900 dark:text-white leading-tight"
              initial={{ y: "100%" }}
              animate={isInView ? { y: 0 } : { y: "100%" }}
              transition={{ ...SPRING_CONFIG, delay: mobileDelay + 0.3 }}
              style={{ willChange: "transform" }}
            >
              {item.roleMobile || item.role}
            </motion.h3>
          </div>
        </motion.div>

        {/* Row 2: Dot, Pole, Gap, Separator */}
        {/* Dynamic Pole (spans Col 1 & 2, width is 100% - 16px to start exactly at dot center) */}
        <div className="col-start-1 col-end-3 row-start-2 row-end-3 flex justify-end items-center h-[2px] w-full z-0 relative">
           <motion.div 
             className="h-full bg-neutral-200 dark:bg-neutral-800 w-[calc(100%-16px)]" 
             style={{ originX: 0, willChange: "transform" }}
             initial={{ scaleX: 0 }}
             animate={{ scaleX: isInView ? 1 : 0 }}
             transition={{ ...SPRING_CONFIG, delay: mobileDelay + 0.1 }}
           />
        </div>

        {/* Dot container */}
        <div className="col-start-1 col-end-2 row-start-2 row-end-3 flex items-center justify-center relative w-8 h-[2px] z-10">
          <motion.div
            className="bg-neutral-900 dark:bg-white rounded-full flex-shrink-0 absolute"
            style={{ 
              width: `${10 + ((item.impressiveness - 1) / 9) * 8}px`, 
              height: `${10 + ((item.impressiveness - 1) / 9) * 8}px`,
              willChange: "transform"
            }}
            initial={{ scale: 0 }}
            animate={{ scale: isInView ? 1 : 0 }}
            transition={{ ...DOT_SPRING_CONFIG, delay: mobileDelay }}
          />
        </div>
        
        {/* Col 3 is the 12px gap, left empty */}

        {/* Separator matches text width */}
        <div className="col-start-4 col-end-5 row-start-2 row-end-3 h-[2px] w-full relative">
           <motion.div 
             className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800" 
             style={{ originX: 0, willChange: "transform" }}
             initial={{ x: -mobileFlagOffset, scaleX: 0 }}
             animate={isInView ? { x: 0, scaleX: 1 } : { x: -mobileFlagOffset, scaleX: 0 }}
             transition={{ ...SPRING_CONFIG, delay: mobileDelay + 0.1 }}
           />
        </div>

        {/* Row 3: Org & Dates */}
        <motion.div 
          className="col-start-4 col-end-5 row-start-3 row-end-4 pt-1.5 flex flex-col justify-start"
          initial={{ x: -mobileFlagOffset }}
          animate={isInView ? { x: 0 } : { x: -mobileFlagOffset }}
          transition={{ ...SPRING_CONFIG, delay: mobileDelay + 0.1 }}
          style={{ willChange: "transform" }}
        >
          <div className="overflow-hidden">
            <motion.p 
              className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium leading-tight"
              initial={{ y: "100%" }}
              animate={isInView ? { y: 0 } : { y: "100%" }}
              transition={{ ...SPRING_CONFIG, delay: mobileDelay + 0.4 }}
              style={{ willChange: "transform" }}
            >
              {item.companyMobile || item.company}
            </motion.p>
          </div>
          <div className="overflow-hidden mt-0.5">
            <motion.div 
              className="text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-500 flex flex-wrap gap-x-2 items-center"
              initial={{ y: "100%" }}
              animate={isInView ? { y: 0 } : { y: "100%" }}
              transition={{ ...SPRING_CONFIG, delay: mobileDelay + 0.5 }}
              style={{ willChange: "transform" }}
            >
              <span>{item.startDate}</span>
              <span>to</span>
              <span>{item.endDate}</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});
