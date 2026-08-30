"use client";

import { useEffect } from "react";
import { IBM_Plex_Serif } from "next/font/google";
import { Download, Send, FolderOpen } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";
import styles from "@/app/(home)/_components/SkipIntroButton.module.css";

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
});

const ANIM_INITIAL = { opacity: 0, y: 120, scale: 0.95, filter: "blur(15px)" };
const ANIM_ANIMATE = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
const ANIM_TRANSITION = {
  type: "spring" as const, stiffness: 100, damping: 20,
  opacity: { type: "tween" as const, duration: 0.4, ease: "linear" },
};

interface HeroContentProps {
  /** When true, SVG title fades in */
  showTitle?: boolean;
  /** When true, subtext + CTA start their animation */
  ctaReady?: boolean;
  /** When true, renders immediately without entrance transitions */
  skipIntroAnimation?: boolean;
}

export default function HeroContent({
  showTitle = false,
  ctaReady = false,
  skipIntroAnimation = false,
}: HeroContentProps) {
  const subtextControls = useAnimationControls();
  const ctaControls = useAnimationControls();

  // Phase 2: Subtext + CTA animate when ctaReady flips (if not skipping intro)
  useEffect(() => {
    if (!ctaReady) return;

    if (skipIntroAnimation) {
      subtextControls.set(ANIM_ANIMATE);
      ctaControls.set(ANIM_ANIMATE);
      return;
    }

    subtextControls.start({
      ...ANIM_ANIMATE,
      transition: ANIM_TRANSITION,
    });
    ctaControls.start({
      ...ANIM_ANIMATE,
      transition: ANIM_TRANSITION,
    });
  }, [ctaReady, skipIntroAnimation, subtextControls, ctaControls]);

  const initialAnim = skipIntroAnimation ? ANIM_ANIMATE : ANIM_INITIAL;
  const animTransition = skipIntroAnimation ? { duration: 0 } : ANIM_TRANSITION;

  return (
    <>
      <h1 className="sr-only">Gilang (Gimiaw) - Full-stack Developer & Product Designer Portfolio</h1>
      {/* --- DESKTOP VERSION --- */}
      <div className="relative z-20 hidden md:flex flex-col items-center text-center text-white px-6 w-full max-w-4xl mx-auto md:-mt-24 lg:-mt-28 xl:-mt-32 2xl:-mt-52">
        {/* SVG Title */}
        {showTitle && (
          <div className="w-full max-w-2xl mx-auto mb-6">
            <motion.div
              initial={initialAnim}
              animate={ANIM_ANIMATE}
              transition={animTransition}
            >
              <img src="/gimigkk.svg" alt="Gilang's Portfolio Title" className="w-full h-auto" fetchPriority="high" />
            </motion.div>
          </div>
        )}

        {/* Subtext - IBM Plex Serif */}
        <motion.p
          initial={initialAnim}
          animate={subtextControls}
          className={`${ibmPlexSerif.className} font-[500] text-[24.5px] opacity-90 mb-3`}
        >
          Full-stack Dev &amp; Product Designer
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={initialAnim}
          animate={ctaControls}
          className="flex justify-center gap-1 w-full max-w-fit mx-auto drop-shadow-xl"
        >
          <span
            className={`${styles.pushable} group cursor-default`}
          >
            <span className={styles.shadow}></span>
            <span className={styles.edgeDark}></span>
            <span
              className={`${styles.frontDark} !flex items-center justify-center gap-2 whitespace-nowrap`}
              style={{ padding: "10px 24px", fontSize: "0.9rem" }}
            >
              <Download size={16} className="transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5" />
              <span>CV</span>
            </span>
          </span>
          <span
            className={`${styles.pushable} group cursor-default`}
          >
            <span className={styles.shadow}></span>
            <span className={styles.edgeDark}></span>
            <span
              className={`${styles.frontDark} !flex items-center justify-center gap-2 whitespace-nowrap`}
              style={{ padding: "10px 24px", fontSize: "0.9rem" }}
            >
              <Send size={16} className="transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <span>Send an Email</span>
            </span>
          </span>
          <span
            className={`${styles.pushable} group cursor-default`}
          >
            <span className={styles.shadow}></span>
            <span className={styles.edgeDark}></span>
            <span
              className={`${styles.frontDark} !flex items-center justify-center gap-2 whitespace-nowrap`}
              style={{ padding: "10px 24px", fontSize: "0.9rem" }}
            >
              <FolderOpen size={16} className="transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110" />
              <span>Projects</span>
            </span>
          </span>
        </motion.div>
      </div>

      {/* --- MOBILE VERSION --- */}
      <div className="relative z-20 flex md:hidden flex-col items-center text-center text-white px-4 w-full mx-auto pointer-events-auto">
        {/* SVG Title */}
        {showTitle && (
          <div className="w-full max-w-[270px] mx-auto mb-10">
            <motion.div
              initial={initialAnim}
              animate={ANIM_ANIMATE}
              transition={animTransition}
            >
              <img src="/gimigkk.svg" alt="Gilang's Portfolio Title" className="w-full h-auto" fetchPriority="high" />
            </motion.div>
          </div>
        )}

        {/* Subtext */}
        <motion.p
          initial={initialAnim}
          animate={subtextControls}
          className={`${ibmPlexSerif.className} font-[400] text-[16.5px] opacity-90 mb-2`}
        >
          Full-stack Dev &amp; Product Designer
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={initialAnim}
          animate={ctaControls}
          className="flex justify-center gap-1 flex-wrap w-full max-w-fit mx-auto drop-shadow-md"
        >
          <span
            className={`${styles.pushable} group cursor-default`}
          >
            <span className={styles.shadow}></span>
            <span className={styles.edgeDark}></span>
            <span
              className={`${styles.frontDark} !flex items-center justify-center gap-1.5 whitespace-nowrap`}
              style={{ padding: "8px 16px", fontSize: "0.8rem" }}
            >
              <Download size={14} className="transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5" />
              <span>CV</span>
            </span>
          </span>
          <span
            className={`${styles.pushable} group cursor-default`}
          >
            <span className={styles.shadow}></span>
            <span className={styles.edgeDark}></span>
            <span
              className={`${styles.frontDark} !flex items-center justify-center gap-1.5 whitespace-nowrap`}
              style={{ padding: "8px 16px", fontSize: "0.8rem" }}
            >
              <Send size={14} className="transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <span>Email</span>
            </span>
          </span>
          <span
            className={`${styles.pushable} group cursor-default`}
          >
            <span className={styles.shadow}></span>
            <span className={styles.edgeDark}></span>
            <span
              className={`${styles.frontDark} !flex items-center justify-center gap-1.5 whitespace-nowrap`}
              style={{ padding: "8px 16px", fontSize: "0.8rem" }}
            >
              <FolderOpen size={14} className="transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110" />
              <span>Projects</span>
            </span>
          </span>
        </motion.div>
      </div>
    </>
  );
}

HeroContent.whyDidYouRender = true;
