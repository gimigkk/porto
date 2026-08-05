"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePreloader } from "@/hooks/usePreloader";
import LoadingScreen from "@/app/(home)/_components/LoadingScreen";
import SkyBackground from "@/components/layout/SkyBackground";
import HeroContent from "@/app/(home)/_components/hero/HeroContent";
import HeroIntroText from "@/app/(home)/_components/hero/HeroIntroText";
import BrowserWarning from "@/app/(home)/_components/hero/BrowserWarning";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import StackedSections from "@/components/layout/StackedSections";
import BackToTop from "@/components/shared/BackToTop";
import type { ProjectMeta } from "@/lib/projects";
import type { GithubGraphDay } from "@/lib/github";
import ClientProjectModal from "@/app/(home)/_components/projects/ClientProjectModal";

// IMPORT: Loading Cormorant Garamond for the stylish accent


/** Firefox CPU-backend backdrop-filter — remove from DOM entirely */
function BlurStack() {
  const [isFirefox, setIsFirefox] = useState<boolean | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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


interface HomeClientProps {
  projects: ProjectMeta[];
  githubGraph: GithubGraphDay[][];
}

export default function HomeClient({ projects, githubGraph }: HomeClientProps) {
  const { isReady, assets } = usePreloader();
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [foldersReady, setFoldersReady] = useState(false);
  const [ctaReady, setCtaReady] = useState(false);
  const [firstFrameRendered, setFirstFrameRendered] = useState(false);



  // Detect mobile and update on resize
  const [isMobile, setIsMobile] = useState(false);
  const [isChromium, setIsChromium] = useState(true);
  const [warningResolved, setWarningResolved] = useState(true);
  const [needsWarning, setNeedsWarning] = useState(false);

  useEffect(() => {
    const mobileMatch = window.matchMedia('(max-width: 768px)').matches;
    const chromeMatch = !!(window as Window & { chrome?: unknown }).chrome;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(mobileMatch);
    setIsChromium(chromeMatch);

    if (mobileMatch || !chromeMatch) {
      const isDismissed = sessionStorage.getItem('browser-warning-dismissed');
      if (isDismissed) {
        setWarningResolved(true);
      } else {
        setNeedsWarning(true);
        setWarningResolved(false);
      }
    } else {
      setWarningResolved(true);
    }

    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);

  // Phase 1: words + contact text animate ONLY AFTER loading screen finishes fading out
  const heroAnimationReady = isReady && loadingComplete;

  // Staggered Phase 2 orchestration
  useEffect(() => {
    if (!introComplete) return;

    // 1 & 2. SVG and Nav+Folders trigger immediately
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFoldersReady(true);

    // 3. CTA + Subtext after 300ms
    const t3 = setTimeout(() => setCtaReady(true), 500);

    return () => {
      clearTimeout(t3);
    };
  }, [introComplete]);

  // Fire event for navbar phase2 uncollapse
  useEffect(() => {
    if (foldersReady) {
      if (typeof window !== "undefined") {
        (window as unknown as { __heroPhase2?: boolean }).__heroPhase2 = true;
      }
      window.dispatchEvent(new Event("hero-phase2"));
    }
  }, [foldersReady]);

  // Transition hero height: 100svh → 95svh when folders appear (80svh on mobile)
  const [heroHeight, setHeroHeight] = useState("100svh");

  useEffect(() => {
    if (foldersReady) {
      // Slight delay so CSS transition kicks after layout
      requestAnimationFrame(() => setHeroHeight(isMobile ? "70svh" : "95svh"));
    }
  }, [foldersReady, isMobile]);

  const handleIntroComplete = useCallback(() => {
    // no-op — kept for clouds callback compatibility
  }, []);

  const handleFirstFrameRendered = useCallback(() => {
    setFirstFrameRendered(true);
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

  // Disable scrolling until intro is completely finished
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!introComplete) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [introComplete]);

  const handleLoadingComplete = useCallback(() => {
    setLoadingComplete(true);
    // Double-ensure we are at top when entering page
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <LanguageProvider>
      <main role="main" className="w-full min-h-svh bg-[#09090b]">

        {/* Hero height via CSS transition — starts 100svh, shrinks to 95/70svh on Phase 2 */}
        <div className="relative z-20 w-full">
          {/* Section 1 */}
          <section
            id="home"
            className="w-full flex flex-col items-center justify-start pt-[120px] md:pt-0 md:justify-center text-zinc-900 sticky z-10 overflow-hidden"
            style={{
              height: heroHeight,
              transition: "height 600ms cubic-bezier(0.22,1,0.36,1), top 600ms cubic-bezier(0.22,1,0.36,1)",
              top: `calc(136px - ${heroHeight})`,
            }}
          >
            {/* Mobile & Desktop: Sky inside hero — handles its own CSS for fixed/absolute */}
            <SkyBackground
              isReady={isReady} // Start immediately behind loading screen
              preloadedAssets={assets}
              onIntroComplete={handleIntroComplete}
              onFirstFrameRendered={handleFirstFrameRendered}
              heroHeight={heroHeight}
              isMobile={isMobile}
            />
            {/* dark gradient overlay — fades in with folders and fades out on scroll */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
              style={{ opacity: scrollOpacity }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 h-60 bg-linear-to-t from-[#00000081] to-transparent"
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
            </motion.div>

            {/* PROGRESSIVE BLUR STACK — hidden on mobile & Firefox to avoid compositing jank */}
            <BlurStack />

            {/* Warning Screen - intercepts before intro text if needed */}
            {needsWarning && !warningResolved && (
              <BrowserWarning
                isReady={heroAnimationReady}
                isMobile={isMobile}
                isChromium={isChromium}
                onComplete={() => {
                  sessionStorage.setItem('browser-warning-dismissed', 'true');
                  setWarningResolved(true);
                }}
              />
            )}

            {/* Intro text overlay — centered, disappears after outro */}
            {!introComplete && warningResolved && (
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

          {/* Loading screen — waits for fonts AND first canvas frame to finish */}
          {!loadingComplete && (
            <LoadingScreen
              isReady={isReady && firstFrameRendered}
              onComplete={handleLoadingComplete}
            />
          )}

          {/* Sections 2, 3, 4 (Stacked Folders with nested Footer inside Projects) */}
          <StackedSections projects={projects} isReady={foldersReady} githubGraph={githubGraph} />
        </div>

        <ClientProjectModal projects={projects} />

        {/* Back to Top — fixed bottom-center */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <BackToTop />
        </div>
      </main>
    </LanguageProvider>
  );
}