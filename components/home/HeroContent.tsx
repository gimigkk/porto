"use client";

import { useEffect } from "react";
import { IBM_Plex_Serif } from "next/font/google";
import { Download, Send, FolderOpen } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";

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
          <div className="w-full max-w-2xl mx-auto mb-4 overflow-hidden">
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
          className={`${ibmPlexSerif.className} font-[500] text-[22px] opacity-90 mb-2`}
        >
          Full-stack Dev &amp; Product Designer
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={ctaControls}
          className="flex justify-center -space-x-2 w-full max-w-fit mx-auto drop-shadow-xl"
        >
          <a
            href="/cv.pdf"
            style={{ borderTopLeftRadius: "6px", borderBottomLeftRadius: "6px", borderTopRightRadius: "20px", borderBottomRightRadius: "20px" }}
            className="group flex items-center justify-center bg-zinc-950 text-white text-sm px-6 py-2 font-medium z-10"
          >
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-[15px] opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
              <Download size={15} />
            </span>
            <span>CV</span>
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-[15px] group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
              <Download size={15} />
            </span>
          </a>
          <a
            href="mailto:contact@example.com"
            className="group flex items-center justify-center bg-zinc-950 text-white text-sm px-6 py-2 rounded-full font-medium z-20"
          >
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-[15px] opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
              <Send size={15} />
            </span>
            <span>Send an Email</span>
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-[15px] group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
              <Send size={15} />
            </span>
          </a>
          <a
            href="#projects"
            style={{ borderTopLeftRadius: "20px", borderBottomLeftRadius: "20px", borderTopRightRadius: "6px", borderBottomRightRadius: "6px" }}
            className="group flex items-center justify-center bg-zinc-950 text-white text-sm px-6 py-2 font-medium z-10"
          >
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-[15px] opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
              <FolderOpen size={15} />
            </span>
            <span>Projects</span>
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-[15px] group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
              <FolderOpen size={15} />
            </span>
          </a>
        </motion.div>
      </div>

      {/* --- MOBILE VERSION --- */}
      <div className="relative z-20 flex md:hidden flex-col items-center text-center text-white px-4 w-full mx-auto pointer-events-auto">
        {/* SVG Title */}
        {showTitle && (
          <div className="w-full max-w-sm mx-auto mb-2 overflow-hidden">
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
          className={`${ibmPlexSerif.className} font-[400] text-[17.5px] opacity-90 mb-1`}
        >
          Full-stack Dev &amp; Product Designer
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={ctaControls}
          className="flex justify-center -space-x-1 w-full max-w-fit mx-auto drop-shadow-md"
        >
          <a
            href="/cv.pdf"
            style={{ borderTopLeftRadius: "6px", borderBottomLeftRadius: "6px", borderTopRightRadius: "16px", borderBottomRightRadius: "16px" }}
            className="group flex items-center justify-center bg-zinc-950 text-white text-xs px-4 py-2.5 font-medium z-10"
          >
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-3 opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
              <Download size={12} />
            </span>
            <span>CV</span>
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-3 group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
              <Download size={12} />
            </span>
          </a>
          <a
            href="mailto:contact@example.com"
            className="group flex items-center justify-center bg-zinc-950 text-white text-xs px-4 py-2.5 rounded-full font-medium z-20"
          >
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-3 opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
              <Send size={12} />
            </span>
            <span>Send an Email</span>
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-3 group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
              <Send size={12} />
            </span>
          </a>
          <a
            href="#projects"
            style={{ borderTopLeftRadius: "16px", borderBottomLeftRadius: "16px", borderTopRightRadius: "6px", borderBottomRightRadius: "6px" }}
            className="group flex items-center justify-center bg-zinc-950 text-white text-xs px-4 py-2.5 font-medium z-10"
          >
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-3 opacity-100 scale-100 mr-1.5 group-hover:w-0 group-hover:opacity-0 group-hover:scale-0 group-hover:mr-0">
              <FolderOpen size={12} />
            </span>
            <span>Projects</span>
            <span className="inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-0 opacity-0 scale-0 ml-0 group-hover:w-3 group-hover:opacity-100 group-hover:scale-100 group-hover:ml-1.5">
              <FolderOpen size={12} />
            </span>
          </a>
        </motion.div>
      </div>
    </>
  );
}
