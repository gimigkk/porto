"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useCallback } from "react";
import { useLenis } from "lenis/react";

export default function ProjectModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const lenis = useLenis();

  // Disable main page scrolling when modal is open
  useEffect(() => {
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";

    return () => {
      if (lenis) lenis.start();
      document.body.style.overflow = "";
    };
  }, [lenis]);

  const close = useCallback(() => {
    // Clear the search param without resetting scroll position
    router.push("?", { scroll: false });
  }, [router]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [close]);

  return (
    <div className="fixed inset-0 z-[20000] flex items-end justify-center sm:px-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.8 }}
        style={{ willChange: "transform" }}
        className="relative w-full h-[92dvh] max-w-6xl bg-zinc-950 rounded-t-3xl border border-b-0 border-zinc-800 flex flex-col overflow-hidden"
      >
        {/* Header / Close Button */}
        <div className="absolute top-0 right-0 z-20 flex items-center justify-end p-5 pointer-events-none">
          <button
            onClick={close}
            className="p-2.5 text-zinc-400 bg-zinc-900/80 hover:text-white hover:bg-zinc-800 rounded-full backdrop-blur transition-colors pointer-events-auto shadow-lg border border-zinc-700/50"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-950" data-lenis-prevent="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
