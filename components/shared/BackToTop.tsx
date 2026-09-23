"use client";

import { useEffect, useState, useRef, RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import "./BackToTop.css";

interface BackToTopProps {
  scrollRef?: RefObject<HTMLElement | null>;
  threshold?: number;
}

export default function BackToTop({ scrollRef, threshold = 200 }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const lenis = useLenis();
  const visibleRef = useRef(false);

  useEffect(() => {
    let ticking = false;
    const checkScroll = (currentScroll: number) => {
      const nextVisible = currentScroll > threshold;
      if (nextVisible !== visibleRef.current) {
        visibleRef.current = nextVisible;
        setVisible(nextVisible);
      }
    };

    if (scrollRef?.current) {
      const el = scrollRef.current;
      const handleScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          checkScroll(el.scrollTop);
        });
      };
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    } else if (lenis) {
      const onLenisScroll = (inst: { scroll: number }) => {
        checkScroll(inst.scroll);
      };
      lenis.on("scroll", onLenisScroll);
      return () => {
        lenis.off("scroll", onLenisScroll);
      };
    } else {
      const handleScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          checkScroll(window.scrollY);
        });
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [scrollRef, threshold, lenis]);

  const scrollToTop = () => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollToTop}
          className="back-to-top-btn"
          aria-label="Back to top"
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg className="btt-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 15L12 8L19 15"
              stroke="rgb(161, 161, 170)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
