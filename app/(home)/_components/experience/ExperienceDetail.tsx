"use client";

import React from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ExperienceItem } from "@/types/experience";

interface ExperienceDetailProps {
  item: ExperienceItem;
  isInView?: boolean;
}

const slotTransition: Transition = {
  duration: 0.65,
  ease: [0.16, 1, 0.3, 1],
};

export const ExperienceDetail = React.memo(function ExperienceDetail({
  item,
  isInView = true,
}: ExperienceDetailProps) {
  const primaryImg = item.image;
  const secondaryImg = item.secondaryImage || item.image;

  // Monotonic sequence counter to ensure alternating between garments
  // always mounts a fresh DOM node and animates strictly from below (y: 100% -> 0%)
  // rather than resurrecting an exiting node from above (negative y).
  const seqRef = React.useRef(0);
  const prevIdRef = React.useRef(item.id);

  if (prevIdRef.current !== item.id) {
    prevIdRef.current = item.id;
    seqRef.current += 1;
  }

  const slotKey = `${item.id}-${seqRef.current}`;

  return (
    <div
      className="w-full [contain:content]"
      role="tabpanel"
      aria-label={`${item.role} details`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="w-full flex flex-col">
        {/* Dynamic 2-Image Diptych (Float up with smooth GPU transform) */}
        {primaryImg && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={
              isInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 32 }
            }
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
              mass: 0.85,
              delay: 0.10,
            }}
            className="relative w-full h-[clamp(135px,19vh,170px)] sm:h-[165px] md:h-[185px] will-change-transform"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={slotKey}
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
                    loading="lazy"
                    decoding="async"
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
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Details Underneath with Progressive Staggered Float-Up */}
        <div className="mt-3 sm:mt-4 flex flex-col min-h-0 lg:min-h-[140px]">
          {/* Slot 1: Role */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 20 }
            }
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
              mass: 0.85,
              delay: 0.18,
            }}
            className="grid grid-cols-1 overflow-hidden py-0.5 min-h-[1.75rem] sm:min-h-[2rem]"
          >
            <AnimatePresence initial={false}>
              <motion.h3
                key={slotKey}
                initial={{ y: "100%", opacity: 0.2 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ ...slotTransition, delay: 0.04 }}
                className="col-start-1 row-start-1 text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight"
              >
                {item.role}
              </motion.h3>
            </AnimatePresence>
          </motion.div>

          {/* Slot 2: Company & Dates */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={
              isInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 16 }
            }
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
              mass: 0.85,
              delay: 0.26,
            }}
            className="grid grid-cols-1 overflow-hidden py-0.5 mt-0.5 sm:mt-1 min-h-[1.25rem] sm:min-h-[1.5rem]"
          >
            <AnimatePresence initial={false}>
              <motion.p
                key={slotKey}
                initial={{ y: "100%", opacity: 0.2 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ ...slotTransition, delay: 0.12 }}
                className="col-start-1 row-start-1 text-xs sm:text-sm font-medium text-neutral-400"
              >
                {item.company} <span className="mx-1.5 opacity-40">•</span> {item.startDate} — {item.endDate}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Slot 3: Description */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={
              isInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 16 }
            }
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
              mass: 0.85,
              delay: 0.34,
            }}
            className="grid grid-cols-1 overflow-hidden py-0.5 mt-2 sm:mt-3 h-[3.85rem] sm:h-[4.25rem]"
          >
            <AnimatePresence initial={false}>
              <motion.p
                key={slotKey}
                initial={{ y: "100%", opacity: 0.2 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ ...slotTransition, delay: 0.2 }}
                className="col-start-1 row-start-1 text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-3"
              >
                {item.description}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
});
