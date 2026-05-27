"use client";

import { motion, MotionValue, useTransform, useMotionValue } from "framer-motion";
import { ReactNode } from "react";

interface FolderSectionProps {
  tabPosition: "left" | "center" | "right";
  bgClass: string;
  fillClass: string;
  stickyClass: string;
  tabTitle: string;
  children: ReactNode;
  scrollYProgress?: MotionValue<number>;
  parallaxOffset?: number;
}

export default function FolderSection({
  tabPosition,
  bgClass,
  fillClass,
  stickyClass,
  tabTitle,
  children,
  scrollYProgress,
  parallaxOffset = 0,
}: FolderSectionProps) {
  const fallbackProgress = useMotionValue(0);
  // If scrollYProgress is provided, map 0->1 to 0->parallaxOffset
  const y = useTransform(
    scrollYProgress || fallbackProgress,
    [0, 1],
    [0, parallaxOffset]
  );
  // All folders just have rounded-t-2xl at the far edges, the tabs seamlessly merge into them.
  const bodyRadius = "rounded-t-2xl";

  const TabContent = () => (
    <div className="relative w-[320px] h-[64px] -mt-[24px] flex items-center justify-center z-10">
      <svg
        width="320"
        height="64"
        viewBox="0 0 320 64"
        className={`absolute inset-0 ${fillClass}`}
      >
        <path d="M 0 64 L 12 64 Q 32 64, 40 48 L 56 16 Q 64 0, 84 0 L 236 0 Q 256 0, 264 16 L 280 48 Q 288 64, 308 64 L 320 64 Z" />
      </svg>
      <span className="text-white/80 font-semibold tracking-wide text-lg relative z-10 pb-1">
        {tabTitle}
      </span>
    </div>
  );

  return (
    <motion.div className={`${stickyClass} w-full`} style={{ y }}>
      <div className="w-full h-full flex flex-col">
        {/* Tab Row */}
        <div className="flex w-full h-10 md:px-12 relative z-10 translate-y-[1px]">
          {/* Left Tab Slot */}
          <div className="flex-1 flex items-end">
            {tabPosition === "left" && <TabContent />}
          </div>

          {/* Center Tab Slot */}
          <div className="flex-1 flex items-end justify-center">
            {tabPosition === "center" && <TabContent />}
          </div>

          {/* Right Tab Slot */}
          <div className="flex-1 flex items-end justify-end">
            {tabPosition === "right" && <TabContent />}
          </div>
        </div>

        {/* Main Body */}
        <div
          className={`flex-1 w-full ${bgClass} ${bodyRadius} p-8 flex flex-col items-center justify-center relative z-20`}
        >
          {children}
          {/* Infinite Downward Extension to prevent peeking during parallax */}
          <div className={`absolute top-full left-0 w-full h-[100vh] ${bgClass}`} />
        </div>
      </div>
    </motion.div>
  );
}
