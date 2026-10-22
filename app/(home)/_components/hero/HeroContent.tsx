"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import CompanyLogoGrid from "./CompanyLogoGrid";

const ANIM_INITIAL = { opacity: 0, y: 200, scale: 0.9, filter: "blur(10px)" };
const ANIM_ANIMATE = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
const ANIM_TRANSITION = {
  duration: 1,
  ease: [0.13, 0.11, 0.21, 1] as const,
  opacity: { duration: 0.6, ease: "linear" },
  filter: { duration: 0.6, ease: "linear" },
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

      <div className="relative z-20 flex flex-col items-center text-center text-white px-3 md:px-6 w-full max-w-[340px] md:max-w-2xl mx-auto md:-mt-24 lg:-mt-28 xl:-mt-32 2xl:-mt-52 pointer-events-auto">
        {showTitle && (
          <div className="w-full max-w-[280px] md:max-w-none mx-auto mb-6 md:mb-7">
            <motion.div
              initial={initialAnim}
              animate={ANIM_ANIMATE}
              transition={animTransition}
            >
              <Image
                src="/gimigkk.svg"
                alt="Gilang's Portfolio Title"
                width={693}
                height={222}
                className="w-full h-auto"
                priority
              />
            </motion.div>
          </div>
        )}

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
