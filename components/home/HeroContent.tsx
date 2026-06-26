"use client";

import { useEffect } from "react";
import { IBM_Plex_Serif } from "next/font/google";
import { Download, Send, FolderOpen } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";
import styles from "./SkipIntroButton.module.css";

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

interface HeroContentProps {
  /** When true, SVG title fades in */
  showTitle?: boolean;
  /** When true, subtext + CTA start their animation */
  ctaReady?: boolean;
}

export default function HeroContent({ showTitle = false, ctaReady = false }: HeroContentProps) {
  const subtextControls = useAnimationControls();
  const ctaControls = useAnimationControls();

  // Phase 2: Subtext + CTA animate when ctaReady flips
  useEffect(() => {
    if (!ctaReady) return;

    subtextControls.start({
      opacity: 1, y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    });
    ctaControls.start({
      opacity: 1, y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    });
  }, [ctaReady]);

  return (
    <>
      {/* --- DESKTOP VERSION --- */}
      <div className="relative z-20 hidden md:flex flex-col items-center text-center text-white px-6 w-full max-w-4xl mx-auto md:-mt-24 lg:-mt-28 xl:-mt-32 2xl:-mt-52">
        {/* SVG Title */}
        {showTitle && (
          <div className="w-full max-w-2xl mx-auto mb-6 overflow-hidden">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src="/gimigkk.svg" alt="gimigkk" className="w-full h-auto" />
            </motion.div>
          </div>
        )}

        {/* Subtext - IBM Plex Serif */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={subtextControls}
          className={`${ibmPlexSerif.className} font-[500] text-[24.5px] opacity-90 mb-3`}
        >
          Full-stack Dev &amp; Product Designer
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={ctaControls}
          className="flex justify-center gap-1 w-full max-w-fit mx-auto drop-shadow-xl"
        >
          <a
            href="/cv.pdf"
            className={`${styles.pushable} group`}
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
          </a>
          <a
            href="mailto:contact@example.com"
            className={`${styles.pushable} group`}
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
          </a>
          <a
            href="#projects"
            className={`${styles.pushable} group`}
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
          </a>
        </motion.div>
      </div>

      {/* --- MOBILE VERSION --- */}
      <div className="relative z-20 flex md:hidden flex-col items-center text-center text-white px-4 w-full mx-auto pointer-events-auto">
        {/* SVG Title */}
        {showTitle && (
          <div className="w-full max-w-sm mx-auto mb-6 overflow-hidden">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src="/gimigkk.svg" alt="gimigkk" className="w-full h-auto" />
            </motion.div>
          </div>
        )}

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={subtextControls}
          className={`${ibmPlexSerif.className} font-[400] text-[16.5px] opacity-90 mb-2`}
        >
          Full-stack Dev &amp; Product Designer
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={ctaControls}
          className="flex justify-center gap-1 flex-wrap w-full max-w-fit mx-auto drop-shadow-md"
        >
          <a
            href="/cv.pdf"
            className={`${styles.pushable} group`}
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
          </a>
          <a
            href="mailto:contact@example.com"
            className={`${styles.pushable} group`}
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
          </a>
          <a
            href="#projects"
            className={`${styles.pushable} group`}
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
          </a>
        </motion.div>
      </div>
    </>
  );
}
