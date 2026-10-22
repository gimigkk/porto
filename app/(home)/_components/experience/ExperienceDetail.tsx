"use client";

import React from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ExperienceItem } from "@/types/experience";

interface ExperienceDetailProps {
  item: ExperienceItem;
}

const slotTransition: Transition = {
  duration: 0.65,
  ease: [0.16, 1, 0.3, 1],
};

export function ExperienceDetail({ item }: ExperienceDetailProps) {
  const primaryImg = item.image;
  const secondaryImg = item.secondaryImage || item.image;

  return (
    <div className="w-full">
      <div className="w-full flex flex-col">
        {/* Dynamic 2-Image Diptych (Direct overlapping crossfade - never goes black) */}
        {primaryImg && (
          <div className="relative w-full h-[135px] sm:h-[160px] md:h-[185px]">
            <AnimatePresence initial={false}>
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full flex items-stretch gap-2 sm:gap-2.5 z-10"
              >
                {/* Primary horizontal image */}
                <div className="flex-[1.5] relative rounded-[4px] md:rounded-md overflow-hidden bg-neutral-900 border border-neutral-800 shadow-sm">
                  <img
                    src={primaryImg}
                    alt={`${item.role} at ${item.company}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                {/* Secondary vertical image */}
                {secondaryImg && (
                  <div className="flex-1 relative rounded-[4px] md:rounded-md overflow-hidden bg-neutral-900 border border-neutral-800 shadow-sm">
                    <img
                      src={secondaryImg}
                      alt={`${item.role} details`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Details Underneath with Simultaneous Grid Slot Slide Up (Never empty) */}
        <div className="mt-3 sm:mt-4 flex flex-col">
          {/* Slot 1: Role */}
          <div className="grid grid-cols-1 overflow-hidden py-0.5">
            <AnimatePresence initial={false}>
              <motion.h3
                key={item.id}
                initial={{ y: "100%", opacity: 0.2 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ ...slotTransition, delay: 0.04 }}
                className="col-start-1 row-start-1 text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight"
              >
                {item.role}
              </motion.h3>
            </AnimatePresence>
          </div>

          {/* Slot 2: Company & Dates */}
          <div className="grid grid-cols-1 overflow-hidden py-0.5 mt-0.5 sm:mt-1">
            <AnimatePresence initial={false}>
              <motion.p
                key={item.id}
                initial={{ y: "100%", opacity: 0.2 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ ...slotTransition, delay: 0.12 }}
                className="col-start-1 row-start-1 text-xs sm:text-sm font-medium text-neutral-400"
              >
                {item.company} <span className="mx-1.5 opacity-40">•</span> {item.startDate} — {item.endDate}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Slot 3: Description */}
          <div className="grid grid-cols-1 overflow-hidden py-0.5 mt-2 sm:mt-3">
            <AnimatePresence initial={false}>
              <motion.p
                key={item.id}
                initial={{ y: "100%", opacity: 0.2 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ ...slotTransition, delay: 0.2 }}
                className="col-start-1 row-start-1 text-xs sm:text-sm text-neutral-300 leading-relaxed"
              >
                {item.description}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
