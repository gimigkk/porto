"use client";

import { motion, MotionValue, useTransform, useMotionValue } from "framer-motion";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useLenis } from "lenis/react";
import {
  getDocumentTop,
  navigationOffsetForStackTop,
  readStackTop,
  type FolderDockMode,
} from "@/components/layout/stackGeometry";

export interface FolderStackTop {
  mobile: number;
  desktop: number;
}

type FolderPositionMode = FolderDockMode;

type FolderStyle = CSSProperties & {
  "--folder-stack-top-mobile": string;
  "--folder-stack-top-desktop": string;
};

interface FolderSectionProps {
  tabPosition: "left" | "center" | "right";
  bgClass: string;
  fillClass: string;
  stackTop: FolderStackTop;
  dockMode: FolderPositionMode;
  anchorRef: RefObject<HTMLDivElement | null>;
  rootRef: RefObject<HTMLDivElement | null>;
  tabTitle: string;
  children: ReactNode;
  scrollYProgress?: MotionValue<number>;
  customFadeProgress?: MotionValue<number>;
  parallaxOffset?: number;
  fadeRange?: [number, number];
  bgBase?: string;
  bgFaded?: string;
  overlapPrevious?: boolean;
  seamExtension?: number;
  pbClass?: string;
}

export default function FolderSection({
  tabPosition,
  bgClass,
  fillClass,
  stackTop,
  dockMode,
  anchorRef,
  rootRef,
  tabTitle,
  children,
  scrollYProgress,
  customFadeProgress,
  parallaxOffset = 0,
  fadeRange,
  bgBase,
  bgFaded,
  overlapPrevious = false,
  seamExtension = 0,
  pbClass = "py-8",
}: FolderSectionProps) {
  const fallbackProgress = useMotionValue(0);
  const source = scrollYProgress || fallbackProgress;

  const y = useTransform(source, [0, 1], [0, parallaxOffset]);
  const defaultProgress = useTransform(source, fadeRange || [0, 0], [0, 1]);
  const progress = customFadeProgress || defaultProgress;
  const overlayOpacity = useTransform(progress, [0, 1], [0, 1]);

  const bodyRadius = "max-md:rounded-none rounded-t-lg sm:rounded-t-xl md:rounded-t-2xl";

  const sectionId = `section-${tabTitle.toLowerCase().replace(/\s+/g, "-")}`;
  const lenis = useLenis();

  const folderStyle: FolderStyle = {
    "--folder-stack-top-mobile": `${stackTop.mobile}px`,
    "--folder-stack-top-desktop": `${stackTop.desktop}px`,
  };
  const rootPositionClass = dockMode !== "flow"
    ? "sticky top-[var(--folder-stack-top)]"
    : "relative";
  const cropShellClass = dockMode === "crop"
    ? "max-h-[calc(100svh-var(--folder-stack-top)-8px)]"
    : "";

  const handleTabClick = () => {
    const root = rootRef.current;
    const anchor = anchorRef.current;
    if (!root && !anchor) return;

    const target = root || anchor!;
    const position = getDocumentTop(target) + navigationOffsetForStackTop(readStackTop(root));
    if (lenis) {
      lenis.scrollTo(position);
    } else {
      window.scrollTo({ top: position, behavior: "smooth" });
    }
  };

  const renderTabContent = () => (
    <button
      onClick={handleTabClick}
      className="relative w-40 h-8 sm:w-55 sm:h-11 md:w-80 md:h-16 -mt-3 sm:-mt-4 md:-mt-6 flex items-center justify-center z-10 focus:outline-none cursor-pointer overflow-visible"
    >
      <svg
        viewBox="0 0 320 64"
        className="absolute inset-0 w-full h-full overflow-visible z-10"
      >
        {/* Base fill — extends 1px (y=65.5) below stroke to mask main body border-t under tab */}
        <path d="M 0 65.5 L 12 65.5 Q 32 65.5, 40 48 L 56 16 Q 64 0, 84 0 L 236 0 Q 256 0, 264 16 L 280 48 Q 288 65.5, 308 65.5 L 320 65.5 Z" fill={bgBase || fillClass} />
        {/* Faded overlay — same extended fill */}
        {bgFaded && (
          <motion.path d="M 0 65.5 L 12 65.5 Q 32 65.5, 40 48 L 56 16 Q 64 0, 84 0 L 236 0 Q 256 0, 264 16 L 280 48 Q 288 65.5, 308 65.5 L 320 65.5 Z" fill={bgFaded} style={{ opacity: overlayOpacity }} />
        )}
        {/* Border stroke (unclosed path at y=64.5 to align flush with main body border-t) */}
        <path d="M 0 64.5 L 12 64.5 Q 32 64.5, 40 48 L 56 16 Q 64 0, 84 0 L 236 0 Q 256 0, 264 16 L 280 48 Q 288 64.5, 308 64.5 L 320 64.5" fill="none" className="stroke-zinc-800" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="text-white/80 font-semibold tracking-wide text-[12px] sm:text-sm md:text-lg relative z-20 pb-0.5 md:pb-1">
        {tabTitle}
      </span>
    </button>
  );

  return (
    <>
      <div ref={anchorRef} id={sectionId} className="w-full h-0 invisible" aria-hidden="true" />
      <motion.div
        ref={rootRef}
        data-folder-root={sectionId}
        data-dock-mode={dockMode}
        className={`${rootPositionClass} ${overlapPrevious ? "-mt-5 sm:-mt-7 md:-mt-10" : ""} [--folder-stack-top:var(--folder-stack-top-mobile)] md:[--folder-stack-top:var(--folder-stack-top-desktop)] w-full`}
        style={{ ...folderStyle, y: dockMode === "flow" ? 0 : y, willChange: "transform" }}
      >
        <div className={`w-full flex flex-col ${cropShellClass}`}>
          {/* Tab Row */}
          <div className="relative w-full z-30 shrink-0">
            <div data-folder-tab-row className="flex w-full max-w-350 mx-auto h-5 sm:h-7 md:h-10 px-0">
              {/* Left Tab Slot */}
              <div className="flex-1 flex items-end">
                {tabPosition === "left" && renderTabContent()}
              </div>

              {/* Center Tab Slot */}
              <div className="flex-1 flex items-end justify-center">
                {tabPosition === "center" && renderTabContent()}
              </div>

              {/* Right Tab Slot */}
              <div className="flex-1 flex items-end justify-end">
                {tabPosition === "right" && renderTabContent()}
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div
            data-folder-body
            className={`w-full min-h-0 ${bodyRadius} ${pbClass} flex flex-col items-center justify-start relative z-20 border-t border-x border-zinc-800 overflow-hidden`}
            style={bgBase ? { background: bgBase } : undefined}
          >
            {/* Background overlay for smooth parallax fade */}
            {bgBase && bgFaded ? (
              <motion.div
                className="absolute inset-0 z-0"
                style={{ background: bgFaded, opacity: overlayOpacity, willChange: "opacity" }}
              />
            ) : !bgBase && bgClass ? (
              <div className={`absolute inset-0 z-0 ${bgClass}`} />
            ) : null}
            <div className="relative z-10 w-full min-h-0 flex flex-col justify-start">
              {children}
            </div>
          </div>
        </div>
        {seamExtension > 0 && (
          <div
            data-folder-seam-extension
            className="absolute top-full left-0 z-0 w-full pointer-events-none"
            style={{ height: seamExtension, ...(bgBase ? { background: bgBase } : {}) }}
            aria-hidden="true"
          >
            {bgBase && bgFaded ? (
              <motion.div
                className="absolute inset-0"
                style={{ background: bgFaded, opacity: overlayOpacity, willChange: "opacity" }}
              />
            ) : !bgBase && bgClass ? (
              <div className={`absolute inset-0 ${bgClass}`} />
            ) : null}
          </div>
        )}
      </motion.div>
    </>
  );
}
