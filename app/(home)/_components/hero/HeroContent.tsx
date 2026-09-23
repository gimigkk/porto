"use client";

import { motion } from "framer-motion";
import CompanyLogoGrid from "./CompanyLogoGrid";

const ANIM_INITIAL = { opacity: 0, y: 80, scale: 0.96, filter: "blur(10px)" };
const ANIM_ANIMATE = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
const ANIM_TRANSITION = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  opacity: { type: "tween" as const, duration: 0.4, ease: "linear" },
};

interface HeroContentProps {
  /** When true, SVG title fades in */
  showTitle?: boolean;
  /** When true, logos start animation */
  ctaReady?: boolean;
  /** When true, renders immediately without entrance transitions */
  skipIntroAnimation?: boolean;
}

export default function HeroContent({
  showTitle = false,
  ctaReady = false,
  skipIntroAnimation = false,
}: HeroContentProps) {
  const initialAnim = skipIntroAnimation ? ANIM_ANIMATE : ANIM_INITIAL;
  const animTransition = skipIntroAnimation ? { duration: 0 } : ANIM_TRANSITION;

  return (
    <>
      <h1 className="sr-only">Gilang (Gimiaw) - Full-stack Developer &amp; Product Designer Portfolio</h1>

      {/* --- DESKTOP VERSION --- */}
      <div className="relative z-20 hidden md:flex flex-col items-center text-center text-white px-6 w-full max-w-2xl mx-auto md:-mt-24 lg:-mt-28 xl:-mt-32 2xl:-mt-52">
        {/* SVG Title */}
        {showTitle && (
          <div className="w-full mb-7">
            <motion.div
              initial={initialAnim}
              animate={ANIM_ANIMATE}
              transition={animTransition}
            >
              <img src="/gimigkk.svg" alt="Gilang's Portfolio Title" className="w-full h-auto" fetchPriority="high" />
            </motion.div>
          </div>
        )}

        {/* Straight-up Company Logos Grid aligned flush with SVG edges */}
        <div className="w-full">
          <CompanyLogoGrid
            ctaReady={ctaReady}
            skipIntroAnimation={skipIntroAnimation}
          />
        </div>
      </div>

      {/* --- MOBILE VERSION --- */}
      <div className="relative z-20 flex md:hidden flex-col items-center text-center text-white px-3 w-full max-w-[340px] mx-auto pointer-events-auto">
        {/* SVG Title */}
        {showTitle && (
          <div className="w-full max-w-[280px] mx-auto mb-6">
            <motion.div
              initial={initialAnim}
              animate={ANIM_ANIMATE}
              transition={animTransition}
            >
              <img src="/gimigkk.svg" alt="Gilang's Portfolio Title" className="w-full h-auto" fetchPriority="high" />
            </motion.div>
          </div>
        )}

        {/* Straight-up Company Logos Grid aligned flush with SVG edges */}
        <div className="w-full">
          <CompanyLogoGrid
            ctaReady={ctaReady}
            skipIntroAnimation={skipIntroAnimation}
          />
        </div>
      </div>
    </>
  );
}

HeroContent.whyDidYouRender = true;
