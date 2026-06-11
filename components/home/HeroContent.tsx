"use client";

import { useRef, useEffect } from "react";
import { IBM_Plex_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { Download, Send, FolderOpen } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

interface HeroContentProps {
  isReady?: boolean;
  /** When true, subtext + CTA start their animation */
  ctaReady?: boolean;
  /** When true, use compressed animation timing (for sequencing after cloud intro on mobile) */
  sequenced?: boolean;
}

export default function HeroContent({ isReady = true, ctaReady = false, sequenced = false }: HeroContentProps) {
  const words = ['Digitalisasi', 'dimulai', 'dari', 'hati,'];
  const mobileHeadlineRef = useRef<HTMLHeadingElement>(null);
  const mobileContactRef = useRef<HTMLParagraphElement>(null);

  // Animation controls for imperative triggering
  const wordControls = words.map(() => useAnimationControls());
  const contactControls = [useAnimationControls(), useAnimationControls(), useAnimationControls()];
  const subtextControls = useAnimationControls();
  const ctaControls = useAnimationControls();

  // Mobile word width matching
  useEffect(() => {
    const matchWidths = () => {
      const headline = mobileHeadlineRef.current;
      const contact = mobileContactRef.current;
      if (!headline || !contact) return;

      // Reset to CSS base size
      contact.style.fontSize = '';
      void contact.offsetWidth;

      const headlineW = headline.scrollWidth;
      const contactW = contact.scrollWidth;

      if (contactW > 0) {
        const baseFontSize = parseFloat(getComputedStyle(contact).fontSize);
        contact.style.fontSize = `${baseFontSize * (headlineW / contactW)}px`;
      }
    };

    document.fonts.ready.then(matchWidths);
    window.addEventListener('resize', matchWidths);
    return () => window.removeEventListener('resize', matchWidths);
  }, []);

  // Phase 1: Words + Contact text animate when isReady flips
  useEffect(() => {
    if (!isReady) return;

    const d = sequenced
      ? { words: [0, 0.3], contact: [1.5, 2.2, 2.4] }
      : { words: [0.1, 0.3], contact: [1.6, 2.3, 2.5] };

    // Words: staggered spring with rotateX
    wordControls.forEach((ctrl, i) => {
      ctrl.start({
        opacity: 1,
        rotateX: 0,
        transition: { type: "spring", bounce: 0.6, duration: 1.2, delay: d.words[0] + i * d.words[1] },
      });
    });

    // Contact text
    contactControls[0].start({
      opacity: 1, rotateX: 0,
      transition: { type: "spring", bounce: 0.5, duration: 1.2, delay: d.contact[0] },
    });
    contactControls[1].start({
      opacity: 1, rotateX: 0,
      transition: { type: "spring", bounce: 0.5, duration: 1.2, delay: d.contact[1] },
    });
    contactControls[2].start({
      opacity: 1, rotateX: 0,
      transition: { type: "spring", bounce: 0.5, duration: 1.2, delay: d.contact[2] },
    });
  }, [isReady]);

  // Phase 2: Subtext + CTA animate when ctaReady flips (together with navbar + clouds)
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
        {/* 1. Big Text - Plus Jakarta Sans */}
        <h1 className={`${plusJakartaSans.className} text-5xl font-[700] tracking-tight mb-2 drop-shadow-xs flex flex-wrap justify-center gap-x-2.5`}>
          {words.map((word, i) => (
            <span key={i} className="inline-block" style={{ perspective: "1000px" }}>
              <motion.span
                initial={{ opacity: 0, rotateX: -90 }}
                animate={wordControls[i]}
                className="inline-block origin-top"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* 2. Contact Text - IBM Plex Serif */}
        <p className={`${ibmPlexSerif.className} font-[400] text-4xl opacity-90 mb-[60px] flex gap-x-2 justify-center`}>
          <span className="inline-block" style={{ perspective: "1000px" }}>
            <motion.span initial={{ opacity: 0, rotateX: -90 }} animate={contactControls[0]} className="italic inline-block origin-top">
              Contact me!
            </motion.span>
          </span>
          <span className="inline-block" style={{ perspective: "1000px" }}>
            <motion.span initial={{ opacity: 0, rotateX: -90 }} animate={contactControls[1]} className="inline-block origin-top">
              Mari
            </motion.span>
          </span>
          <span className="inline-block" style={{ perspective: "1000px" }}>
            <motion.span initial={{ opacity: 0, rotateX: -90 }} animate={contactControls[2]} className="inline-block origin-top">
              berkolaborasi.
            </motion.span>
          </span>
        </p>

        {/* 3. Subtext - IBM Plex Serif */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={subtextControls}
          className={`${ibmPlexSerif.className} font-[400] text-[22.5px] opacity-90 mb-2`}
        >
          Full-stack Dev &amp; Product Designer
        </motion.p>

        {/* 4. CTA Buttons */}
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
      <div className="relative z-20 flex md:hidden flex-col items-center text-center text-white px-4 w-full mx-auto -translate-y-16 pointer-events-auto">
        {/* 1. Big Text */}
        <h1 ref={mobileHeadlineRef} className={`${plusJakartaSans.className} text-[7vw] font-[700] tracking-tight drop-shadow-sm flex flex-nowrap justify-center gap-1 whitespace-nowrap`}>
          {words.map((word, i) => (
            <span key={i} className="inline-block" style={{ perspective: "1000px" }}>
              <motion.span
                initial={{ opacity: 0, rotateX: -90 }}
                animate={wordControls[i]}
                className="inline-block origin-top"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* 2. Contact Text — font-size dynamically matched to headline width */}
        <p ref={mobileContactRef} className={`${ibmPlexSerif.className} font-[400] text-[5vw] opacity-90 mb-8 whitespace-nowrap`}>
          <span className="inline-block" style={{ perspective: "1000px" }}>
            <motion.span initial={{ opacity: 0, rotateX: -90 }} animate={contactControls[0]} className="italic inline-block origin-top">
              Contact me!
            </motion.span>
          </span>{" "}
          <span className="inline-block" style={{ perspective: "1000px" }}>
            <motion.span initial={{ opacity: 0, rotateX: -90 }} animate={contactControls[1]} className="inline-block origin-top">
              Mari
            </motion.span>
          </span>{" "}
          <span className="inline-block" style={{ perspective: "1000px" }}>
            <motion.span initial={{ opacity: 0, rotateX: -90 }} animate={contactControls[2]} className="inline-block origin-top">
              berkolaborasi.
            </motion.span>
          </span>
        </p>

        {/* 3. Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={subtextControls}
          className={`${ibmPlexSerif.className} font-[400] text-[17.5px] opacity-90 mb-1`}
        >
          Full-stack Dev &amp; Product Designer
        </motion.p>

        {/* 4. CTA Buttons */}
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
