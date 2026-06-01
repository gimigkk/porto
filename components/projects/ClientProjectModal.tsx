"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useCallback, useState, Suspense, useRef } from "react";
import { useLenis } from "@studio-freight/react-lenis";
import { getAllProjects, type ProjectMeta } from "@/lib/projects";
import BackToTop from "@/components/ui/BackToTop";

/* ── Preload all MDX components at module level ────────────── */
const mdxModules: Record<string, React.ComponentType> = {};

function ProjectModalContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("project");
  const lenis = useLenis();

  const [Post, setPost] = useState<React.ComponentType | null>(null);
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectMeta[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Load MDX content when slug changes
  useEffect(() => {
    if (!slug) {
      // Start exit animation
      setIsAnimating(false);
      if (lenis) lenis.start();
      document.body.style.overflow = "";

      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        setPost(null);
        setProject(null);
      }, 400);
      return;
    }

    const allProjs = getAllProjects();
    const proj = allProjs.find((p) => p.slug === slug);
    if (!proj) return;

    setAllProjects(allProjs);
    setProject(proj);
    setIsOpen(true);

    // Load MDX dynamically
    if (mdxModules[slug]) {
      setPost(() => mdxModules[slug]);
      setTimeout(() => setIsAnimating(true), 50);
    } else {
      import(`@/content/projects/${slug}.mdx`).then((mod) => {
        mdxModules[slug] = mod.default;
        setPost(() => mod.default);
        setTimeout(() => setIsAnimating(true), 50);
      });
    }
  }, [slug, lenis]);

  // Lock/unlock body scroll (when modal is actively open and animating)
  useEffect(() => {
    if (isAnimating) {
      if (lenis) lenis.stop();
      document.body.style.overflow = "hidden";
    }
  }, [isAnimating, lenis]);

  const close = useCallback(() => {
    window.history.pushState(null, "", window.location.pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [close]);
  // Track isOpen to prevent flickering on pagination
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle browser back button AND pushState from card clicks
  useEffect(() => {
    const handlePop = () => {
      const params = new URLSearchParams(window.location.search);
      const newSlug = params.get("project");
      if (!newSlug) {
        setIsAnimating(false);
        if (lenis) lenis.start();
        document.body.style.overflow = "";

        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          setIsOpen(false);
          setPost(null);
          setProject(null);
        }, 400);
      } else {
        // Opening a project or paginating
        const allProjs = getAllProjects();
        const proj = allProjs.find((p) => p.slug === newSlug);
        if (!proj) return;
        setAllProjects(allProjs);
        setProject(proj);
        
        const wasOpen = isOpenRef.current;
        if (!wasOpen) {
          setIsOpen(true);
          setIsAnimating(false);
        }

        if (mdxModules[newSlug]) {
          setPost(() => mdxModules[newSlug]);
          if (!wasOpen) setTimeout(() => setIsAnimating(true), 50);
        } else {
          import(`@/content/projects/${newSlug}.mdx`).then((mod) => {
            mdxModules[newSlug] = mod.default;
            setPost(() => mod.default);
            if (!wasOpen) setTimeout(() => setIsAnimating(true), 50);
          });
        }
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [lenis]);

  // Handle ESC key (moved down here)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [close]);

  if (!isOpen || !project || !Post || allProjects.length === 0) return null;

  const currentIndex = allProjects.findIndex(p => p.slug === project.slug);
  const totalProjects = allProjects.length;

  const nextProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < 0) return;
    const nextIdx = (currentIndex + 1) % totalProjects;
    const nextSlug = allProjects[nextIdx].slug;
    window.history.pushState(null, "", `?project=${nextSlug}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const prevProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < 0) return;
    const prevIdx = (currentIndex - 1 + totalProjects) % totalProjects;
    const prevSlug = allProjects[prevIdx].slug;
    window.history.pushState(null, "", `?project=${prevSlug}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:px-6"
      style={{ pointerEvents: isAnimating ? "auto" : "none" }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.4s ease-out forwards;
        }
      `}</style>
      {/* Backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 bg-black/80 transition-opacity"
        style={{
          opacity: isAnimating ? 1 : 0,
          transitionDuration: isAnimating ? "300ms" : "200ms",
          transitionTimingFunction: isAnimating ? "ease-out" : "ease-in",
        }}
      />

      {/* Modal Container — Pure CSS animation */}
      <div
        className="relative w-full h-[95dvh] sm:h-[92dvh] max-w-6xl flex flex-col transition-all pointer-events-none"
        style={{
          transform: isAnimating ? "translateY(0)" : "translateY(120px)",
          opacity: isAnimating ? 1 : 0,
          transitionDuration: isAnimating ? "300ms" : "200ms",
          transitionTimingFunction: isAnimating ? "ease-out" : "ease-in",
        }}
      >
        {/* TOP BAR (Folder Tabs Style) */}
        <div className="flex w-full items-end justify-between h-[40px] pointer-events-auto shrink-0 relative z-10 translate-y-[1px]">
          {/* Left Tab: Pagination */}
          <div className="relative w-[180px] h-full flex items-center justify-center">
            <svg width="288" height="64" viewBox="0 0 288 64" className="absolute inset-0 w-full h-full fill-zinc-900">
              <path d="M 0 64 L 0 24 Q 0 0, 24 0 L 204 0 Q 224 0, 232 16 L 248 48 Q 256 64, 276 64 L 288 64 Z" />
            </svg>
            <div className="relative z-10 flex items-center justify-center gap-3 pb-1 pr-8 w-full">
              <button onClick={prevProject} className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors" aria-label="Previous project">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-[13px] font-mono text-zinc-400 select-none">
                {currentIndex + 1} of {totalProjects}
              </span>
              <button onClick={nextProject} className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors" aria-label="Next project">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Tab: Close Button */}
          <div className="relative w-[80px] h-full flex items-center justify-center">
            {/* Custom narrowed SVG to fit X button with sloped left, flat right */}
            <svg width="128" height="64" viewBox="0 0 128 64" className="absolute inset-0 w-full h-full fill-zinc-900">
              <path d="M 0 64 L 12 64 Q 32 64, 40 48 L 56 16 Q 64 0, 84 0 L 104 0 Q 128 0, 128 24 L 128 64 Z" />
            </svg>
            <div className="relative z-10 flex items-center justify-center pb-1 pl-8 w-full">
              <button onClick={close} className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5" aria-label="Close modal">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Wrapper (Gradient + Scrollable Body) */}
        <div className="flex-1 w-full bg-zinc-900 overflow-hidden pointer-events-auto relative z-20 flex flex-col">
          {/* Top Fade Gradient */}
          <div className="absolute top-0 left-0 w-full h-12 sm:h-16 bg-gradient-to-b from-zinc-900 to-transparent z-30 pointer-events-none" />

          {/* Scrollable Content Body */}
          <div ref={scrollBodyRef} className="flex-1 w-full overflow-y-auto no-scrollbar" data-lenis-prevent="true">
            <article key={project.slug} className="min-h-full bg-zinc-900 text-zinc-200 flex flex-col">
              {/* Header: Text Left, Video Right */}
              <header 
                className="w-full max-w-5xl mx-auto px-6 pt-12 sm:pt-16 pb-10 border-b border-zinc-800/50 animate-slide-up-fade"
                style={{ opacity: 0, animationDelay: "100ms" }}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-8">
                  {/* Left: Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{project.category}</span>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: project.accent }} />
                      <span className="text-[11px] font-mono text-zinc-400">{project.year}</span>
                    </div>

                    <h1
                      className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight"
                      style={{ color: project.accent }}
                    >
                      {project.title}
                    </h1>

                    <p className="text-base text-zinc-400 leading-relaxed mb-6">
                      {project.description}
                    </p>

                    <div>
                      <h3 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Technologies</h3>
                      <div className="flex flex-wrap gap-2">
                        {project.stack.map(tech => (
                          <span key={tech} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5 transition-colors hover:bg-zinc-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://skillicons.dev/icons?i=${tech}&theme=dark`} alt={tech} className="w-3.5 h-3.5 rounded-[2px]" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Video */}
                  <div className="w-full md:w-80 lg:w-96 shrink-0">
                    <div className="w-full aspect-video bg-zinc-800 rounded-xl border border-zinc-700 flex items-center justify-center overflow-hidden relative group">
                      <div className="w-12 h-12 rounded-full bg-zinc-700/80 border border-zinc-600 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all cursor-pointer">
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Article body */}
              <div
                className="flex-1 w-full px-6 py-10 sm:py-12 prose prose-invert prose-zinc max-w-5xl mx-auto prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-strong:text-zinc-200 prose-li:text-zinc-400 hover:prose-a:opacity-80 animate-slide-up-fade"
                style={{ 
                  "--tw-prose-links": project.accent, 
                  paddingBottom: "calc(2rem + 46px + 1rem)",
                  opacity: 0,
                  animationDelay: "200ms",
                } as React.CSSProperties}
              >
                <Post />
              </div>
            </article>
          </div>

          {/* Back to Top */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
            <BackToTop scrollRef={scrollBodyRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientProjectModal() {
  return (
    <Suspense fallback={null}>
      <ProjectModalContent />
    </Suspense>
  );
}
