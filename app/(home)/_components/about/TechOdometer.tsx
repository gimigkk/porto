"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TechIcon from "@/components/shared/TechIcon";
import { useTooltip } from "@/components/providers/TooltipProvider";
import { GithubTooltipContent } from "./tooltips/GithubTooltipContent";

export interface TechItem {
  slug: string;
  name: string;
}

export interface TechCategory {
  id: string;
  title: string;
  items: (TechItem | null)[];
}

export const TECH_CATEGORIES: TechCategory[] = [
  {
    id: "languages",
    title: "Core Languages",
    items: [
      { slug: "ts", name: "TypeScript" },
      { slug: "rust", name: "Rust" },
      { slug: "python", name: "Python" },
      { slug: "go", name: "Go" },
      { slug: "postgres", name: "SQL (PostgreSQL)" },
    ],
  },
  {
    id: "frontend",
    title: "Frontend Engineering",
    items: [
      null,
      { slug: "nextjs", name: "Next.js" },
      { slug: "react", name: "React" },
      { slug: "tailwind", name: "Tailwind CSS" },
      { slug: "playwright", name: "Playwright" },
    ],
  },
  {
    id: "backend",
    title: "Backend & Cloud",
    items: [
      { slug: "axum", name: "Axum" },
      { slug: "nodejs", name: "Express / Node" },
      { slug: "supabase", name: "Supabase" },
      { slug: "cloudflare", name: "Cloudflare R2" },
      { slug: "docker", name: "Docker" },
    ],
  },
  {
    id: "database",
    title: "Database & ORM",
    items: [
      null,
      { slug: "postgres", name: "PostgreSQL" },
      { slug: "drizzle", name: "Drizzle ORM" },
      { slug: "prisma", name: "Prisma" },
      { slug: "sqlx", name: "SQLx" },
    ],
  },
  {
    id: "systems",
    title: "Systems & Engines",
    items: [
      null,
      { slug: "linux", name: "Linux" },
      { slug: "godot", name: "Godot 4" },
      { slug: "socketio", name: "Socket.IO" },
      { slug: "git", name: "Git" },
    ],
  },
];

interface TechOdometerProps {
  align?: "left" | "right";
  isMobile?: boolean;
  trigger?: boolean;
  onAdvanceRef?: React.MutableRefObject<(() => void) | null>;
}

export default function TechOdometer({
  align = "right",
  isMobile = false,
  trigger = true,
  onAdvanceRef,
}: TechOdometerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { showTooltip, hideTooltip } = useTooltip();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextCategory = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % TECH_CATEGORIES.length);
  }, []);

  const selectCategory = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    if (onAdvanceRef) {
      onAdvanceRef.current = nextCategory;
    }
  }, [onAdvanceRef, nextCategory]);

  useEffect(() => {
    if (!trigger || isPaused) return;

    timerRef.current = setInterval(() => {
      nextCategory();
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trigger, isPaused, nextCategory]);

  const current = TECH_CATEGORIES[currentIndex];
  const displayItems = align === "left" ? current.items.filter(Boolean) : current.items;
  const isRight = align === "right";

  return (
    <div
      className="flex items-stretch select-none group/odometer"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        hideTooltip();
      }}
    >
      <style>{`
        @keyframes odometerProgress {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>

      {/* Main Odometer Content */}
      <div className={`flex flex-col justify-between ${isRight ? "items-end text-right pr-3.5" : "items-start text-left pl-3.5"}`}>
        {/* Odometer Title */}
        <div className={`overflow-hidden h-[26px] sm:h-[28px] relative w-full flex items-center ${isRight ? "justify-end" : "justify-start"}`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current.id}
              initial={{ y: 22, opacity: 0, filter: "blur(3px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -22, opacity: 0, filter: "blur(3px)" }}
              transition={{
                duration: 0.35,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className={`font-serif ${isMobile ? "text-base" : "text-xl sm:text-2xl"} font-medium text-zinc-100 tracking-tight leading-none whitespace-nowrap`}
            >
              {current.title}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 5 Fixed-width slot columns right-anchored: animation cascades from the RIGHT */}
        <div className={`flex items-center ${isRight ? "justify-end" : "justify-start"} ${isMobile ? "gap-2" : "gap-3"} mt-2 h-5.5 sm:h-6`}>
          {displayItems.map((item, slotIndex) => {
            const rightCascadeDelay = (4 - slotIndex) * 0.05;

            return (
              <div
                key={slotIndex}
                className={`${isMobile ? "w-5 h-5" : "w-5.5 h-5.5 sm:w-6 sm:h-6"} flex items-center justify-center relative overflow-hidden`}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {item ? (
                    <motion.div
                      key={`${current.id}-${item.slug}-${slotIndex}`}
                      initial={{ y: 24, opacity: 0, filter: "blur(3px)" }}
                      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={{ y: -24, opacity: 0, filter: "blur(3px)" }}
                      transition={{
                        duration: 0.42,
                        delay: isRight ? rightCascadeDelay : slotIndex * 0.05,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      className="w-full h-full flex items-center justify-center cursor-help text-zinc-400 hover:text-zinc-100 transition-colors"
                      onMouseEnter={() => showTooltip(<GithubTooltipContent text={item.name} />)}
                      onMouseLeave={hideTooltip}
                      onClick={nextCategory}
                    >
                      <TechIcon
                        tech={item.slug}
                        size={isMobile ? 18 : 22}
                        className="w-full h-full transition-transform duration-200 hover:scale-120 text-zinc-400 hover:text-zinc-100"
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical Segmented Progress Bar: exactly spans top of title to bottom of icons */}
      {isRight && (
        <div className="flex flex-col self-stretch justify-between items-center gap-1 w-[2.5px] pt-[2px]">
          {TECH_CATEGORIES.map((cat, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(idx)}
                aria-label={`Switch to ${cat.title}`}
                className="w-full flex-1 bg-zinc-800/90 rounded-full overflow-hidden cursor-pointer relative group/dash hover:bg-zinc-700/80 transition-colors"
              >
                {isCompleted && (
                  <div className="w-full h-full bg-zinc-400/80 rounded-full" />
                )}
                {isActive && (
                  <div
                    key={`progress-fill-${currentIndex}`}
                    className="w-full h-full bg-zinc-100 shadow-[0_0_6px_rgba(255,255,255,0.6)] rounded-full origin-top"
                    style={{
                      animation: "odometerProgress 3.5s linear forwards",
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
