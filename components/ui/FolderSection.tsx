"use client";

import { motion, MotionValue, useTransform, useMotionValue } from "framer-motion";
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
  const progress = useTransform(source, fadeRange || [0, 0], [0, 1]);
  const overlayOpacity = useTransform(progress, [0, 1], [0, 1]);

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
      className="relative w-40 h-8 sm:w-55 sm:h-11 md:w-80 md:h-16 -mt-3 sm:-mt-4 md:-mt-6 flex items-center justify-center z-10 focus:outline-none cursor-pointer"
    >
      <svg
        viewBox="0 0 320 64"
        className="absolute inset-0 w-full h-full"
      >
        {/* Base fill — bgBase is real hex color */}
        <path d="M 0 64 L 12 64 Q 32 64, 40 48 L 56 16 Q 64 0, 84 0 L 236 0 Q 256 0, 264 16 L 280 48 Q 288 64, 308 64 L 320 64 Z" fill={bgBase || fillClass} />
        {/* Faded overlay — same opacity as body bg */}
        {bgFaded && (
          <motion.path d="M 0 64 L 12 64 Q 32 64, 40 48 L 56 16 Q 64 0, 84 0 L 236 0 Q 256 0, 264 16 L 280 48 Q 288 64, 308 64 L 320 64 Z" fill={bgFaded} style={{ opacity: overlayOpacity }} />
        )}
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
        style={{ y, willChange: "transform" }}
      >
        <div className="w-full h-full flex flex-col">
          {/* Tab Row */}
          <div className="w-full relative z-10 translate-y-px">
            <div className="flex w-full max-w-350 mx-auto h-5 sm:h-7 md:h-10 px-0 sm:px-2 md:px-1.25">
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
            {/* Background: Tailwind class or hex */}
            {bgBase ? (
              <>
                <div
                  className="absolute inset-0 z-0"
                  style={{ background: bgBase }}
                />
                {bgFaded && (
                  <motion.div
                    className="absolute inset-0 z-0"
                    style={{ background: bgFaded, opacity: overlayOpacity, willChange: "opacity" }}
                  />
                )}
              </>
            ) : (
              <div className={`absolute inset-0 z-0 ${bgClass}`} />
            )}
            <div className="relative z-10 w-full h-full">
              {children}
            </div>
            {/* Infinite Downward Extension */}
            {bgFaded ? (
              <motion.div
                className="absolute top-full left-0 w-full h-svh z-0"
                style={{ background: bgFaded, opacity: overlayOpacity, willChange: "opacity" }}
              />
            ) : bgClass ? (
              <div className={`absolute top-full left-0 w-full h-svh z-0 ${bgClass}`} />
            ) : null}
          </div>
        </div>
      </motion.div>
    </>
  );
}
