"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { usePreloader } from "@/hooks/usePreloader";
import LoadingScreen from "@/components/home/LoadingScreen";
import SkyBackground from "@/components/layout/SkyBackground";
import HeroContent from "@/components/home/HeroContent";
import HeroIntroText from "@/components/home/HeroIntroText";
import StackedSections from "@/components/layout/StackedSections";
import ClientProjectModal from "@/components/projects/ClientProjectModal";
import BackToTop from "@/components/ui/BackToTop";
import type { ProjectMeta } from "@/lib/projects";

// IMPORT: Loading Cormorant Garamond for the stylish accent
import { Cormorant_Garamond } from 'next/font/google';

/** Firefox CPU-backend backdrop-filter — remove from DOM entirely */
function BlurStack() {
  const [isFirefox, setIsFirefox] = useState<boolean | null>(null);
  useEffect(() => {
    setIsFirefox(navigator.userAgent.includes("Firefox"));
  }, []);
  // Hydration: SSR renders blur, first client paint shows it.
  // After mount: Firefox gets null (no blur DOM at all).
  if (isFirefox) return null;
  return (
    <div className="hidden md:block absolute bottom-0 left-0 right-0 h-24 pointer-events-none select-none z-15 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 75%)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 75%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)',
        }}
      />
    </div>
  );
}

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['600'],
  display: 'swap',
});

interface HomeClientProps {
  projects: ProjectMeta[];
}

export default function HomeClient({ projects }: HomeClientProps) {
  const { isReady, assets } = usePreloader();
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [foldersReady, setFoldersReady] = useState(false);
  const [cloudsReady, setCloudsReady] = useState(false);
  const [ctaReady, setCtaReady] = useState(false);

  // Detect mobile and update on resize
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Phase 1: words + contact text animate immediately when preloader done
  const heroAnimationReady = isReady;

  // Staggered Phase 2 orchestration
  useEffect(() => {
    if (!introComplete) return;

    // 1 & 2. SVG and Nav+Folders trigger immediately
    setFoldersReady(true);
    // 3. Clouds after 400ms
    const t2 = setTimeout(() => setCloudsReady(true), 400);
    // 4. CTA + Subtext after 700ms total
    const t3 = setTimeout(() => setCtaReady(true), 700);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [introComplete]);

  // Fire event for navbar phase2 uncollapse
  useEffect(() => {
    if (foldersReady) {
      window.dispatchEvent(new Event("hero-phase2"));
    }
  }, [foldersReady]);

  // Transition hero height: 100svh → 95svh when folders appear (80svh on mobile)
  const [heroHeight, setHeroHeight] = useState("100svh");

  useEffect(() => {
    if (foldersReady) {
      // Slight delay so CSS transition kicks after layout
      requestAnimationFrame(() => setHeroHeight(isMobile ? "80svh" : "95svh"));
    }
  }, [foldersReady, isMobile]);

  const handleIntroComplete = useCallback(() => {
    // no-op — kept for clouds callback compatibility
  }, []);

  // Prevent browser scroll restoration on refresh and start at top
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo({ top: 0 });
    }
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setLoadingComplete(true);
    // Double-ensure we are at top when entering page
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      <main className="w-full min-h-svh bg-[#141416]">
        {/* Fixed sky + clouds layer — parallax 0.5x, docks at end of 3rd folder */}
        <SkyBackground
          isReady={cloudsReady}
          preloadedAssets={assets}
          onIntroComplete={handleIntroComplete}
          heroHeight={heroHeight}
        />

        {/* Responsive Hero Height Variable */}
        {/* Hero height via CSS transition — starts 100svh, shrinks to 95svh on Phase 2 */}
        <div className="relative z-20 w-full">
          {/* Section 1 */}
          <section
            id="home"
            className="w-full flex flex-col items-center justify-center text-zinc-900 sticky z-10 overflow-hidden"
            style={{
              height: heroHeight,
              transition: "height 600ms cubic-bezier(0.22,1,0.36,1), top 600ms cubic-bezier(0.22,1,0.36,1)",
              top: `calc(136px - ${heroHeight})`,
            }}
          >
            {/* dark gradient overlay — fades in with folders */}
            <div
              className="absolute bottom-0 left-0 right-0 h-60 bg-linear-to-t from-[#00000081] to-transparent z-10"
              style={{
                opacity: foldersReady ? 1 : 0,
                transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#000000b2] to-transparent z-11"
              style={{
                opacity: foldersReady ? 1 : 0,
                transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />

            {/* PROGRESSIVE BLUR STACK — hidden on mobile & Firefox to avoid compositing jank */}
            <BlurStack />

            {/* Intro text overlay — centered, disappears after outro */}
            {!introComplete && (
              <HeroIntroText
                isReady={heroAnimationReady}
                sequenced={isMobile}
                onComplete={() => setIntroComplete(true)}
              />
            )}

            {/* Persistent content — SVG title fades in after intro, subtext+CTA on phase2 */}
            <HeroContent
              showTitle={introComplete}
              ctaReady={ctaReady}
            />
          </section>

          {/* Loading screen — debounced, only shows if load takes >300ms */}
          {!loadingComplete && (
            <LoadingScreen
              isReady={isReady}
              onComplete={handleLoadingComplete}
            />
          )}

          {/* Sections 2, 3, 4 (Stacked Folders) — id used for dock measurement */}
          <StackedSections projects={projects} isReady={foldersReady} />
        </div>

        {/* Section 5 */}
        <section className="h-svh w-full flex flex-col items-center justify-center bg-zinc-950 text-white relative z-30">
          <h2 className="text-5xl font-bold mb-6 text-amber-500">Section 5</h2>
          <div className="text-xl opacity-80 max-w-xl text-center">
            CTA Kerja Sama
          </div>
        </section>

        <ClientProjectModal projects={projects} />

        {/* Back to Top — fixed bottom-center */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <BackToTop />
        </div>
      </main>
    </>
  );
}