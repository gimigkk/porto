"use client";

import { motion, MotionValue, useTransform, useMotionValue, useMotionTemplate } from "framer-motion";
import { ReactNode } from "react";
import { useLenis } from "lenis/react";

interface FolderSectionProps {
  tabPosition: "left" | "center" | "right";
  bgClass: string;
  fillClass: string;
  stickyClass: string;
  tabTitle: string;
  children: ReactNode;
  scrollYProgress?: MotionValue<number>;
  parallaxOffset?: number;
  scrollOffset?: number;
  fadeRange?: [number, number];
  bgBase?: string;
  bgFaded?: string;
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
  scrollOffset = 0,
  fadeRange,
  bgBase,
  bgFaded,
}: FolderSectionProps) {
  const fallbackProgress = useMotionValue(0);
  const source = scrollYProgress || fallbackProgress;

  const y = useTransform(source, [0, 1], [0, parallaxOffset]);

  // Lerp progress mapped through fadeRange
  const progress = useTransform(source, fadeRange || [0, 0], [0, 1]);

  // Parse hex helpers
  const hexToR = (hex: string) => parseInt(hex.slice(1, 3), 16);
  const hexToG = (hex: string) => parseInt(hex.slice(3, 5), 16);
  const hexToB = (hex: string) => parseInt(hex.slice(5, 7), 16);

  // Always create transforms — fallback to 0,0,0 if no faded color
  const toR = bgBase && bgFaded ? hexToR(bgFaded) : 0;
  const toG = bgBase && bgFaded ? hexToG(bgFaded) : 0;
  const toB = bgBase && bgFaded ? hexToB(bgFaded) : 0;
  const fromR = bgBase ? hexToR(bgBase) : 0;
  const fromG = bgBase ? hexToG(bgBase) : 0;
  const fromB = bgBase ? hexToB(bgBase) : 0;

  const r = useTransform(progress, [0, 1], [fromR, toR]);
  const g = useTransform(progress, [0, 1], [fromG, toG]);
  const b = useTransform(progress, [0, 1], [fromB, toB]);

  const bodyBg = useMotionTemplate`rgb(${r}, ${g}, ${b})`;
  const tabFill = bodyBg;

  // All folders just have rounded-t-2xl at the far edges, the tabs seamlessly merge into them.
  const bodyRadius = "rounded-t-lg sm:rounded-t-xl md:rounded-t-2xl";

  const sectionId = `section-${tabTitle.toLowerCase().replace(/\s+/g, "-")}`;
  const lenis = useLenis();

  const handleTabClick = () => {
    if (lenis) {
      lenis.scrollTo(`#${sectionId}`, { offset: scrollOffset });
    }
  };

  const TabContent = () => (
    <button
      onClick={handleTabClick}
      className="relative w-[160px] h-[32px] sm:w-[220px] sm:h-[44px] md:w-[320px] md:h-[64px] -mt-[12px] sm:-mt-[16px] md:-mt-[24px] flex items-center justify-center z-10 focus:outline-none cursor-pointer"
    >
      <svg
        viewBox="0 0 320 64"
        className="absolute inset-0 w-full h-full"
      >
        <motion.path d="M 0 64 L 12 64 Q 32 64, 40 48 L 56 16 Q 64 0, 84 0 L 236 0 Q 256 0, 264 16 L 280 48 Q 288 64, 308 64 L 320 64 Z" fill={bgFaded ? tabFill : fillClass} />
      </svg>
      <span className="text-white/80 font-semibold tracking-wide text-[12px] sm:text-sm md:text-lg relative z-10 pb-0.5 md:pb-1">
        {tabTitle}
      </span>
    </button>
  );

  return (
    <>
      <div id={sectionId} className="w-full h-0 invisible" aria-hidden="true" />
      <motion.div
        className={`${stickyClass} w-full`}
        style={{ y }}
      >
        <div className="w-full h-full flex flex-col">
          {/* Tab Row */}
          <div className="w-full relative z-10 translate-y-[1px]">
            <div className="flex w-full max-w-[1400px] mx-auto h-[20px] sm:h-[28px] md:h-[40px] px-0 sm:px-2 md:px-[5px]">
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
          </div>

          {/* Main Body */}
          <div
            className={`flex-1 w-full ${bodyRadius} py-8 flex flex-col items-center justify-center relative z-20 overflow-hidden`}
          >
            {/* Background with interpolation */}
            <motion.div
              className="absolute inset-0 z-0"
              style={{ background: bodyBg }}
            />
            <div className="relative z-10 w-full h-full">
              {children}
            </div>
            {/* Infinite Downward Extension to prevent peeking during parallax */}
            <motion.div
              className="absolute top-full left-0 w-full h-svh z-0"
              style={{ background: bodyBg }}
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
