"use client";

import { useEffect, useState, RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./BackToTop.css";

interface BackToTopProps {
  scrollRef?: RefObject<HTMLElement | null>;
  threshold?: number;
}

export default function BackToTop({ scrollRef, threshold = 200 }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If scrollRef given, listen on that element. Otherwise, listen on window.
    if (scrollRef?.current) {
      const el = scrollRef.current;
      const handleScroll = () => setVisible(el.scrollTop > threshold);
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    } else {
      const handleScroll = () => setVisible(window.scrollY > threshold);
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [scrollRef, threshold]);

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
