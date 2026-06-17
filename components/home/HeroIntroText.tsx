"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { IBM_Plex_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { motion, useAnimationControls } from "framer-motion";
import SkipIntroButton from "./SkipIntroButton";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

interface HeroIntroTextProps {
  isReady: boolean;
  sequenced?: boolean;
  onComplete?: () => void;
}

export default function HeroIntroText({ isReady, sequenced = false, onComplete }: HeroIntroTextProps) {
  const words = ['Digitalisasi', 'dimulai', 'dari', 'hati,'];

  const headlineRef = useRef<HTMLHeadingElement>(null);
  const contactRef = useRef<HTMLParagraphElement>(null);
  const skippedRef = useRef(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  // Animation controls for imperative triggering
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wordControls = words.map(() => useAnimationControls());
  const contactControls = [useAnimationControls(), useAnimationControls(), useAnimationControls()];
  const skipButtonControl = useAnimationControls();

  // Width matching: scale contact text font-size to match headline width
  useEffect(() => {
    const matchWidths = () => {
      const h = headlineRef.current;
      const c = contactRef.current;
      if (!h || !c) return;
      c.style.fontSize = '';
      void c.offsetWidth;
      const hW = h.scrollWidth;
      const cW = c.scrollWidth;
      if (cW > 0) {
        const base = parseFloat(getComputedStyle(c).fontSize);
        c.style.fontSize = `${base * (hW / cW)}px`;
      }
    };

    document.fonts.ready.then(matchWidths);
    window.addEventListener('resize', matchWidths);
    return () => window.removeEventListener('resize', matchWidths);
  }, []);

  const triggerOutro = useCallback(async () => {
    // Outro (rotate out, anchor bottom) — tween so promise resolves at exact end
    const outroWords = wordControls.map((ctrl, i) =>
      ctrl.start({
        opacity: 0, rotateX: 90, transformOrigin: "bottom",
        transition: { duration: 0.5, ease: [0.55, 0, 1, 0.45], delay: i * 0.08 },
      })
    );
    const outroContact = contactControls.map((ctrl, i) =>
      ctrl.start({
        opacity: 0, rotateX: 90, transformOrigin: "bottom",
        transition: { duration: 0.5, ease: [0.55, 0, 1, 0.45], delay: 0.32 + i * 0.08 },
      })
    );
    const outroSkip = skipButtonControl.start({
      opacity: 0,
      transition: { duration: 0.15, ease: "easeIn" }
    });

    await Promise.all([...outroWords, ...outroContact, outroSkip]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = useCallback(async () => {
    if (skippedRef.current) return;
    skippedRef.current = true;

    // Stop ongoing animations immediately
    wordControls.forEach(ctrl => ctrl.stop());
    contactControls.forEach(ctrl => ctrl.stop());
    skipButtonControl.stop();

    await triggerOutro();
    onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOutro, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpaceDown(false);
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleSkip]);

  // Intro → delay → outro → onComplete
  useEffect(() => {
    if (!isReady) return;

    const d = sequenced
      ? { words: [0, 0.24], contact: [1.5, 2.2, 2.4] }
      : { words: [0.08, 0.24], contact: [1.6, 2.3, 2.5] };

    const run = async () => {
      // Intro (rotate in from top)
      const introWords = wordControls.map((ctrl, i) =>
        ctrl.start({
          opacity: 1, rotateX: 0, transformOrigin: "top",
          transition: { type: "spring", bounce: 0.6, duration: 0.96, delay: d.words[0] + i * d.words[1] },
        })
      );
      const introContact = contactControls.map((ctrl, i) =>
        ctrl.start({
          opacity: 1, rotateX: 0, transformOrigin: "top",
          transition: { type: "spring", bounce: 0.5, duration: 1.2, delay: d.contact[i] },
        })
      );
      // Start skip button fade in independently
      skipButtonControl.start({
        opacity: 1,
        transition: { duration: 0.2, delay: 0.1, ease: "easeOut" }
      });

      await Promise.all([...introWords, ...introContact]);

      // Pause
      if (skippedRef.current) return;
      await new Promise((r) => setTimeout(r, 300));

      if (skippedRef.current) return;
      await triggerOutro();

      if (skippedRef.current) return;
      onComplete?.();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, sequenced]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-white pointer-events-none">
      {/* Headline */}
      <h1
        ref={headlineRef}
        className={`${plusJakartaSans.className} text-5xl md:text-5xl text-[7vw] font-[700] tracking-tight mb-2 drop-shadow-xs flex flex-nowrap justify-center gap-x-2.5 md:gap-x-2.5 gap-1 whitespace-nowrap`}
      >
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

      {/* Contact text */}
      <p
        ref={contactRef}
        className={`${ibmPlexSerif.className} font-[400] text-4xl md:text-4xl text-[5vw] opacity-90 whitespace-nowrap`}
      >
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

      {/* Skip Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={skipButtonControl}
        className="pointer-events-auto mt-8 md:mt-12 scale-[0.55] md:scale-[0.65] origin-top"
      >
        <SkipIntroButton onClick={handleSkip} label={sequenced ? 'SKIP INTRO' : undefined} isActive={isSpaceDown} isReady={isReady} />
      </motion.div>
    </div>
  );
}
