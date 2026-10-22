"use client";

import { useState, useCallback, useEffect } from "react";
import { useLenis } from "lenis/react";
import { usePreloader } from "@/app/(home)/_components/hooks/usePreloader";
import { useBrowserEnvironment } from "@/hooks/useBrowserEnvironment";
import LoadingScreen from "@/app/(home)/_components/LoadingScreen";
import SkyBackground from "@/app/(home)/_components/layout/SkyBackground";
import HeroContent from "@/app/(home)/_components/hero/HeroContent";
import FigmaCollabCursors from "@/app/(home)/_components/hero/FigmaCollabCursors";
import HeroIntroText from "@/app/(home)/_components/hero/HeroIntroText";
import BrowserWarning from "@/app/(home)/_components/hero/BrowserWarning";
import StackedSections from "@/app/(home)/_components/layout/StackedSections";
import BackToTop from "@/components/ui/BackToTop";
import type { ProjectMeta } from "@/lib/projects";
import type { GithubGraphDay } from "@/lib/github";
import ClientProjectModal from "@/components/projects/ClientProjectModal";
import { MOBILE_MEDIA_QUERY } from "@/app/(home)/_components/layout/stackGeometry";

// IMPORT: Loading Cormorant Garamond for the stylish accent


interface HomeClientProps {
  projects: ProjectMeta[];
  githubGraph: GithubGraphDay[][];
}

// Module-level in-memory flag: resets on browser refresh (F5), persists during client SPA navigation
let hasCompletedHomeIntroSession = false;

export function getHasCompletedHomeIntro() {
  return hasCompletedHomeIntroSession;
}

export default function HomeClient({ projects, githubGraph }: HomeClientProps) {
  const { isReady, assets } = usePreloader();
  const [loadingComplete, setLoadingComplete] = useState(() => hasCompletedHomeIntroSession);
  const [introComplete, setIntroComplete] = useState(() => hasCompletedHomeIntroSession);
  const [foldersReady, setFoldersReady] = useState(() => hasCompletedHomeIntroSession);
  const [ctaReady, setCtaReady] = useState(() => hasCompletedHomeIntroSession);
  const [firstFrameRendered, setFirstFrameRendered] = useState(() => hasCompletedHomeIntroSession);
  const [isRevisit] = useState(() => hasCompletedHomeIntroSession);
  const [heroHeight, setHeroHeight] = useState(() => {
    if (typeof window !== "undefined" && hasCompletedHomeIntroSession) {
      return window.matchMedia(MOBILE_MEDIA_QUERY).matches ? "70svh" : "95svh";
    }
    return "100svh";
  });
  const lenis = useLenis();

  // Handle revisit within same SPA session (not on page reload/F5)
  useEffect(() => {
    if (hasCompletedHomeIntroSession) {
      window.dispatchEvent(new CustomEvent("hero-phase2", { detail: { isRevisit: true } }));
    }
  }, []);

  // Detect mobile and update on resize via clean hook
  const { isMobile, isChromium, needsWarning: envNeedsWarning } = useBrowserEnvironment();
  const [warningDismissed, setWarningDismissed] = useState(false);
  const needsWarning = envNeedsWarning && !warningDismissed;
  const warningResolved = !needsWarning;

  // Phase 1: words + contact text animate ONLY AFTER loading screen finishes fading out
  const heroAnimationReady = isReady && loadingComplete;

  // Staggered Phase 2 orchestration
  useEffect(() => {
    if (!introComplete) return;

    hasCompletedHomeIntroSession = true;

    if (isRevisit) {
      window.dispatchEvent(new CustomEvent("hero-phase2", { detail: { isRevisit: true } }));
      return;
    }

    const tFolders = setTimeout(() => {
      setFoldersReady(true);
      window.dispatchEvent(new CustomEvent("hero-phase2", { detail: { isRevisit: false } }));
      setHeroHeight(isMobile ? "70svh" : "95svh");
    }, 400);

    const tCta = setTimeout(() => {
      setCtaReady(true);
    }, 850);

    return () => {
      clearTimeout(tFolders);
      clearTimeout(tCta);
    };
  }, [introComplete, isRevisit, isMobile]);

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
      lenis?.stop();
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [introComplete, lenis]);

  const handleLoadingComplete = useCallback(() => {
    setLoadingComplete(true);
    // Double-ensure we are at top when entering page
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <main role="main" className="w-full min-h-svh bg-[#09090b]">

        {/* Hero height via CSS transition — starts 100svh, shrinks to 95/70svh on Phase 2 */}
        <div className="relative z-20 w-full">
          {/* Section 1 */}
          <section
            id="home"
            className="w-full flex flex-col items-center justify-start pt-[120px] md:pt-0 md:justify-center text-zinc-900 sticky z-10 overflow-hidden"
            style={{
              height: heroHeight,
              transition: isRevisit ? "none" : "height 700ms cubic-bezier(0.22,1,0.36,1), top 700ms cubic-bezier(0.22,1,0.36,1)",
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
              isRevisit={isRevisit}
            />
            {/* Subtle bottom gradient — invisible during intro, fades in synced with entry animation */}
            <div
              className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none select-none z-10 bg-linear-to-t from-[#141416] via-[#141416]/40 to-transparent"
              style={{
                opacity: foldersReady ? 1 : 0,
                transition: isRevisit ? "none" : "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />

            {/* Warning Screen - intercepts before intro text if needed */}
            {needsWarning && (
              <BrowserWarning
                isReady={heroAnimationReady}
                isMobile={isMobile}
                isChromium={isChromium}
                onComplete={() => {
                  sessionStorage.setItem("browser-warning-dismissed", "true");
                  setWarningDismissed(true);
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
            <div className="absolute top-0 inset-x-0 h-[95svh] max-md:h-[70svh] flex flex-col items-center justify-center max-md:justify-start max-md:pt-[120px] pointer-events-none">
              <div className="w-full pointer-events-auto">
                <HeroContent
                  showTitle={introComplete}
                  ctaReady={ctaReady}
                  skipIntroAnimation={isRevisit}
                />
              </div>
            </div>

            {/* Fake Figma-style collaboration cursors */}
            <FigmaCollabCursors isReady={ctaReady || isRevisit} />
          </section>

          {/* Loading screen — waits for fonts AND first canvas frame to finish */}
          {!loadingComplete && !isRevisit && (
            <LoadingScreen
              isReady={isReady && firstFrameRendered}
              onComplete={handleLoadingComplete}
            />
          )}

          {/* Sections 2, 3, 4 (Stacked Folders with nested Footer inside Projects) */}
          <StackedSections projects={projects} isReady={foldersReady} githubGraph={githubGraph} isRevisit={isRevisit} />
        </div>

        <ClientProjectModal projects={projects} />

        {/* Back to Top — fixed bottom-center */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <BackToTop />
        </div>
      </main>
  );
}
