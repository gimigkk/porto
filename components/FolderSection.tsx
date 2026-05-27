"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FolderSectionProps {
  tabPosition: "left" | "center" | "right";
  bgClass: string;
  fillClass: string;
  stickyClass: string;
  tabTitle: string;
  children: ReactNode;
}

export default function FolderSection({
  tabPosition,
  bgClass,
  fillClass,
  stickyClass,
  tabTitle,
  children,
}: FolderSectionProps) {
  // All folders just have rounded-t-2xl at the far edges, the tabs seamlessly merge into them.
  const bodyRadius = "rounded-t-2xl";

  const TabContent = () => (
    <div className="relative w-[240px] h-[64px] -mt-[24px] flex items-center justify-center z-10">
      <svg
        width="240"
        height="64"
        viewBox="0 0 240 64"
        className={`absolute inset-0 ${fillClass}`}
      >
        <path d="M 0 64 L 4 64 Q 16 64, 22 48 L 34 16 Q 40 0, 52 0 L 188 0 Q 200 0, 206 16 L 218 48 Q 224 64, 236 64 L 240 64 Z" />
      </svg>
      <span className="text-white/80 font-semibold tracking-wide text-lg relative z-10 pb-1">
        {tabTitle}
      </span>
    </div>
  );

  return (
    <div className={`${stickyClass} w-full`}>
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
        </div>
      </div>
    </div>
  );
}
