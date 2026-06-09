"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { usePreloader } from "@/hooks/usePreloader";
import LoadingScreen from "@/components/home/LoadingScreen";
import AsciiClouds from "@/components/AsciiClouds/AsciiClouds";
import HeroContent from "@/components/home/HeroContent";
import StackedSections from "@/components/layout/StackedSections";
import ClientProjectModal from "@/components/projects/ClientProjectModal";
import type { ProjectMeta } from "@/lib/projects";

// IMPORT: Loading Cormorant Garamond for the stylish accent
import { Cormorant_Garamond } from 'next/font/google';

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
  const [cloudIntroComplete, setCloudIntroComplete] = useState(false);

  // Detect mobile once on mount
  const isMobile = useMemo(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  []);

  // Cloud intro starts as soon as preloader is ready
  const animationReady = isReady;

  // Hero animations: on mobile, wait for cloud intro to finish first.
  // On desktop, fire immediately (desktop handles concurrent load fine).
  const heroAnimationReady = isMobile ? cloudIntroComplete : isReady;

  const handleIntroComplete = useCallback(() => {
    setCloudIntroComplete(true);
  }, []);

  // Trigger Navbar uncollapse as soon as preloader is ready
  useEffect(() => {
    if (isReady) {
      window.dispatchEvent(new Event("hero-ready"));
    }
  }, [isReady]);

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

      <main className="w-full min-h-[100svh] bg-[#141416]">
        <div className="relative z-20 w-full">
          {/* Section 1 */}
          <section
            id="home"
            className="h-[95svh] w-full flex flex-col items-center justify-center text-zinc-900 sticky z-10 overflow-hidden"
            style={{ top: "calc(136px - 95svh)" }}
          >
            {/* Sky blue gradient bg */}
            <div className="absolute inset-0 bg-linear-to-b from-[#0c3888] to-[#50aaff]" />

            {/* ASCII Clouds */}
            <div className="absolute inset-0 pointer-events-none select-none z-10">
              <AsciiClouds
                className="w-full h-full"
                isReady={animationReady}
                preloadedAssets={assets}
                onIntroComplete={handleIntroComplete}
              />
            </div>

            {/* dark gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#00000081] to-transparent z-0" />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-[#000000b2] to-transparent z-11" />

            {/* PROGRESSIVE BLUR STACK — hidden on mobile to avoid GPU compositing jank during scroll */}
            <div className="hidden md:block absolute bottom-0 left-0 right-0 h-24 pointer-events-none select-none z-15 overflow-hidden">
              {/* Layer 1 */}
              <div
                className="absolute inset-0"
                style={{
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 75%)',
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 75%)',
                }}
              />

              {/* Layer 2 */}
              <div
                className="absolute inset-0"
                style={{
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)',
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)',
                }}
              />
            </div>

            {/* Content */}
            <HeroContent isReady={heroAnimationReady} sequenced={isMobile} />
            {/* <div className="absolute bottom-6 left-0 right-0 z-20 select-none pointer-events-none">
              <div className="max-w-7xl mx-auto px-6 md:px-8 text-right">
                <p className="text-white/80 text-lg md:text-xs tracking-wider font-mono font-medium ">
                  It's a real{" "}
                  <span className={`${cormorant.className} italic text-white text-lg md:text-xl font-black px-1 tracking-tight`}>
                    cloud sim ASCII
                  </span>{" "}
                  btw
                </p>
              </div>
            </div> */}
          </section>

          {/* Loading screen — debounced, only shows if load takes >300ms */}
          {!loadingComplete && (
            <LoadingScreen
              isReady={isReady}
              onComplete={handleLoadingComplete}
            />
          )}

          {/* Sections 2, 3, 4 (Stacked Folders) */}
          <StackedSections projects={projects} isReady={animationReady} />
        </div>

        {/* Section 5 */}
        <section className="h-[100svh] w-full flex flex-col items-center justify-center bg-zinc-950 text-white relative z-30">
          <h2 className="text-5xl font-bold mb-6 text-amber-500">Section 5</h2>
          <div className="text-xl opacity-80 max-w-xl text-center">
            CTA Kerja Sama
          </div>
        </section>

        <ClientProjectModal projects={projects} />
      </main>
    </>
  );
}