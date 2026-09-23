"use client";

import { useEffect, useCallback, useState, useRef, useSyncExternalStore } from "react";
import { useLenis } from "lenis/react";
import NProgress from "nprogress";
import Image from "next/image";
import { useInView } from "framer-motion";
import { Gamepad2, ExternalLink, Video } from "lucide-react";
import type { ProjectMeta } from "@/lib/projects";
import BackToTop from "@/components/shared/BackToTop";
import TechIcon from "@/components/shared/TechIcon";
import LangToggle from "@/components/shared/LangToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";

const subscribeToProjectSlug = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  window.addEventListener("project-modal-changed", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("project-modal-changed", callback);
    window.removeEventListener("hashchange", callback);
  };
};

const getProjectSlugSnapshot = () => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#project=")) {
    return hash.substring(9);
  }
  return null;
};

const getServerSnapshot = () => null;

function useProjectSlug() {
  return useSyncExternalStore(subscribeToProjectSlug, getProjectSlugSnapshot, getServerSnapshot);
}


/* -- Preload all MDX components at module level -------------- */
const mdxModules: Record<string, React.ComponentType> = {};

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function CulledVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "200px" });

  return (
    <div ref={ref} className={className}>
      {isInView && (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          controls
          onCanPlay={(event) => {
            event.currentTarget.playbackRate = 1.5;
          }}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

function ReadingProgressBar({ scrollRef, accent }: { scrollRef: React.RefObject<HTMLDivElement | null>; accent: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const max = el.scrollHeight - el.clientHeight;
          const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((el.scrollTop / max) * 100))) : 0;
          if (barRef.current) barRef.current.style.width = `${pct}%`;
          if (textRef.current) textRef.current.textContent = `${pct}%`;
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-md bg-zinc-900/50 border border-zinc-800">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-zinc-500 uppercase tracking-wider">Progress</span>
        <span ref={textRef} className="text-zinc-300 font-medium">0%</span>
      </div>
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full transition-all duration-75"
          style={{ width: "0%", backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

function TableOfContents({
  accent,
  slug,
  scrollRef,
}: {
  accent: string;
  slug: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { lang } = useLanguage();
  const [activeId, setActiveId] = useState<string>("");
  const [headings, setHeadings] = useState<TocItem[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const container = scrollRef.current;
      if (!container) return;
      const elements = Array.from(container.querySelectorAll(".prose h2, .prose h3"));
      const items = elements
        .filter((elem) => (elem as HTMLElement).offsetParent !== null)
        .map((elem) => ({
          id: elem.id,
          text: elem.textContent?.trim() || "",
          level: Number(elem.tagName.substring(1)),
        }))
        .filter((item) => item.id && item.text);

      setHeadings(items);

      if (items.length === 0) return;

      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const containerTop = container.getBoundingClientRect().top;
            let current = items[0]?.id || "";
            for (const item of items) {
              const el = document.getElementById(item.id);
              if (el) {
                const elTop = el.getBoundingClientRect().top - containerTop;
                if (elTop <= 120) {
                  current = item.id;
                } else {
                  break;
                }
              }
            }
            setActiveId((prev) => (prev !== current ? current : prev));
            ticking = false;
          });
          ticking = true;
        }
      };

      container.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      return () => container.removeEventListener("scroll", onScroll);
    }, 150);

    return () => clearTimeout(timeout);
  }, [slug, scrollRef, lang]);

  if (headings.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 py-1">
      <h3 className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">Contents</h3>
      <nav className="flex flex-col border-l border-zinc-800">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              title={heading.text}
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById(heading.id);
                const container = scrollRef.current;
                if (target && container) {
                  const targetRect = target.getBoundingClientRect();
                  const containerRect = container.getBoundingClientRect();
                  const top = targetRect.top - containerRect.top + container.scrollTop - 40;
                  container.scrollTo({ top, behavior: "smooth" });
                }
              }}
              className={`block truncate text-xs leading-5 py-1.5 transition-colors border-l-2 -ml-[1px] ${
                isActive
                  ? "text-zinc-100 font-medium"
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              }`}
              style={{
                paddingLeft: heading.level === 3 ? "1.25rem" : "0.75rem",
                borderColor: isActive ? accent : "transparent",
              }}
            >
              {heading.text}
            </a>
          );
        })}
      </nav>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="w-full flex flex-col gap-8 animate-pulse mt-4">
      {/* Paragraph 1 */}
      <div className="space-y-3">
        <div className="h-4 bg-zinc-800/40 rounded w-full"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[96%]"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[88%]"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[75%]"></div>
      </div>
      
      {/* Heading 2 */}
      <div className="h-7 bg-zinc-800/40 rounded w-[40%] mt-4"></div>

      {/* Paragraph 2 */}
      <div className="space-y-3">
        <div className="h-4 bg-zinc-800/40 rounded w-[92%]"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-full"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[85%]"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[60%]"></div>
      </div>

      {/* Code block placeholder */}
      <div className="h-56 bg-zinc-800/20 rounded-xl w-full my-2 border border-zinc-800/40"></div>
    </div>
  );
}

export default function ClientProjectModal({ projects: allProjects }: { projects: ProjectMeta[] }) {
  const slug = useProjectSlug();
  const lenis = useLenis();

  const [Post, setPost] = useState<React.ComponentType | null>(null);
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Load MDX content when slug changes
  useEffect(() => {
    if (!slug) {
      if (isOpen || isAnimating) {
        setIsAnimating(false);
        if (lenis) lenis.start();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";

        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          setIsOpen(false);
          setPost(null);
          setProject(null);
        }, 400);
      }
      return;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    const proj = allProjects.find((p) => p.slug === slug);
    if (!proj) return;

    setProject(proj);
    setIsOpen(true);

    if (mdxModules[slug]) {
      setPost(() => mdxModules[slug]);
      requestAnimationFrame(() => requestAnimationFrame(() => setIsAnimating(true)));
    } else {
      setPost(null); // Clear to show skeleton
      requestAnimationFrame(() => requestAnimationFrame(() => setIsAnimating(true))); // Slide up instantly

      NProgress.start();
      import(`@/content/projects/${slug}.mdx`).then((mod) => {
        mdxModules[slug] = mod.default;
        setPost(() => mod.default);
        NProgress.done();
      });
    }

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [slug, allProjects]);

  // Lock/unlock body scroll (when modal is actively open and animating)
  useEffect(() => {
    if (isAnimating) {
      if (lenis) lenis.stop();
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (lenis) lenis.start();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isAnimating, lenis]);

  const close = useCallback(() => {
    if (typeof window !== "undefined") {
      setIsAnimating(false);
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.pushState(null, "", url.toString());
      window.dispatchEvent(new Event("project-modal-changed"));
      window.dispatchEvent(new Event("hashchange"));
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [close]);

  if (!isOpen || !project || allProjects.length === 0) return null;

  const currentIndex = allProjects.findIndex(p => p.slug === project.slug);
  const totalProjects = allProjects.length;

  const nextProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < 0) return;
    const nextIdx = (currentIndex + 1) % totalProjects;
    const nextSlug = allProjects[nextIdx].slug;
    const newUrl = (typeof window !== "undefined" ? window.location.pathname : "/") + "#project=" + nextSlug;
    window.history.pushState(null, "", newUrl);
    window.dispatchEvent(new Event("project-modal-changed"));
    window.dispatchEvent(new Event("hashchange"));
  };

  const prevProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < 0) return;
    const prevIdx = (currentIndex - 1 + totalProjects) % totalProjects;
    const prevSlug = allProjects[prevIdx].slug;
    const newUrl = (typeof window !== "undefined" ? window.location.pathname : "/") + "#project=" + prevSlug;
    window.history.pushState(null, "", newUrl);
    window.dispatchEvent(new Event("project-modal-changed"));
    window.dispatchEvent(new Event("hashchange"));
  };

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-end justify-center"
      style={{ pointerEvents: isAnimating ? "auto" : "none" }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        figure[data-rehype-pretty-code-figure] {
          margin: 1.75rem 0;
          border-radius: 0.375rem;
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          background: #09090b;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }
        figure[data-rehype-pretty-code-figure]::before {
          content: "";
          display: block;
          height: 28px;
          background: #111114;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background-image: radial-gradient(circle at 14px 14px, #ef4444 3.5px, transparent 4px),
                            radial-gradient(circle at 26px 14px, #eab308 3.5px, transparent 4px),
                            radial-gradient(circle at 38px 14px, #22c55e 3.5px, transparent 4px);
          background-repeat: no-repeat;
        }
        figure[data-rehype-pretty-code-figure] pre {
          padding: 1.25rem 1.5rem !important;
          margin: 0 !important;
          overflow-x: auto;
          background: transparent !important;
          line-height: 1.7;
          font-size: 0.85rem;
        }
        figure[data-rehype-pretty-code-figure] pre::-webkit-scrollbar {
          display: none;
        }
        figure[data-rehype-pretty-code-figure] code {
          background: transparent !important;
          padding: 0 !important;
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
        }
        figure[data-rehype-pretty-code-figure] code > span {
          display: block;
        }
        .prose h2 {
          position: relative;
          padding-top: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          letter-spacing: -0.02em;
        }
        .prose blockquote {
          border-left: 2px solid var(--theme-color) !important;
          background: rgba(255, 255, 255, 0.02);
          padding: 0.75rem 1.25rem !important;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: normal !important;
          color: #d4d4d8 !important;
        }
      `}</style>
      {/* Backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity"
        style={{
          opacity: isAnimating ? 1 : 0,
          transitionDuration: isAnimating ? "300ms" : "200ms",
          transitionTimingFunction: isAnimating ? "cubic-bezier(0.16, 1, 0.3, 1)" : "ease-in",
        }}
      />

      {/* Page-aligned centering wrapper — edge-to-edge on mobile, guttered on desktop */}
      <div className="w-full md:max-w-350 md:mx-auto md:px-12 flex items-end h-full">
        {/* Modal Container — Pure CSS animation */}
        <div
          className="relative w-full h-[95dvh] sm:h-[92dvh] flex flex-col transition-all pointer-events-none md:rounded-t-none"
          style={{
            transform: isAnimating ? "translateY(0)" : "translateY(120px)",
            opacity: isAnimating ? 1 : 0,
            transitionDuration: isAnimating ? "300ms" : "200ms",
            transitionTimingFunction: isAnimating ? "cubic-bezier(0.16, 1, 0.3, 1)" : "ease-in",
          }}
        >
          {/* TOP BAR (Folder Tabs Style) */}
          <div className={`flex w-full items-end justify-between h-[40px] shrink-0 relative z-30 ${isAnimating ? "pointer-events-auto" : "pointer-events-none"}`}>
            {/* Left Tab: Pagination */}
            <div className="relative w-[180px] h-full flex items-center justify-center">
              <svg width="288" height="64" viewBox="0 0 288 64" className="absolute inset-0 w-full h-full fill-zinc-950 overflow-visible">
                <path d="M 0.8 64.8 L 0.8 24 Q 0.8 0, 24 0 L 204 0 Q 224 0, 232 16 L 248 48 Q 256 64.8, 276 64.8 L 288 64.8" stroke="#52525b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
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
              <svg width="128" height="64" viewBox="0 0 128 64" className="absolute inset-0 w-full h-full fill-zinc-950 overflow-visible">
                <path d="M 0 64.8 L 12 64.8 Q 32 64.8, 40 48 L 56 16 Q 64 0, 84 0 L 104 0 Q 127.2 0, 127.2 24 L 127.2 64.8" stroke="#52525b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
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
          <div className={`flex-1 w-full bg-zinc-950 border border-t-0 border-zinc-600 overflow-hidden relative z-20 flex flex-col ${isAnimating ? "pointer-events-auto" : "pointer-events-none"}`}>
            {/* Top gap bridge for the border */}
            <div className="absolute top-0 left-[179px] right-[79px] h-[1px] bg-zinc-600 z-50 pointer-events-none" />

            {/* Top Fade Gradient */}
            <div className="absolute top-0 left-0 w-full h-12 sm:h-16 bg-gradient-to-b from-zinc-950 to-transparent z-30 pointer-events-none transform-gpu" />

            {/* Two-Column Split (Independent Scrolling) */}
            <div className="flex-1 w-full h-full flex flex-col lg:flex-row overflow-hidden relative">

              {/* Left: Main Content Wrapper */}
              <div className="flex-1 h-full relative min-w-0">
                {/* Left: Main Content (Scrolls independently) */}
                <div ref={scrollBodyRef} className="w-full h-full overflow-y-auto no-scrollbar" data-lenis-prevent="true">
                  <article key={project.slug} className="min-h-full bg-zinc-950 text-zinc-200 px-4 sm:px-8 md:px-12 py-12 sm:py-16">
                    <div className="w-full max-w-3xl mx-auto animate-slide-up-fade" style={{ opacity: 0 }}>
                      
                      {/* Project Title */}
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-[1.12] mb-4">
                        {project.title}
                      </h1>

                      {/* Project Description */}
                      <p className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                        {project.description}
                      </p>

                      {/* Quick Action Links Row (Clean — No Pulsing Slop) */}
                      {((project.links && project.links.length > 0) || project.github) && (
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                          {project.links?.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white transition-all shadow-md hover:brightness-110 active:scale-95"
                              style={{
                                backgroundColor: project.accent,
                                boxShadow: `0 4px 14px ${project.accent}30`,
                              }}
                            >
                              {link.icon === "gamepad" ? (
                                <Gamepad2 className="w-3.5 h-3.5" />
                              ) : link.icon === "video" || link.icon === "youtube" ? (
                                <Video className="w-3.5 h-3.5" />
                              ) : (
                                <ExternalLink className="w-3.5 h-3.5" />
                              )}
                              {link.label}
                            </a>
                          ))}
                          {project.github && (
                            <a
                              href={project.github}
                              target="_blank"
                              rel="noreferrer"
                              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-700/80 transition-all shadow-sm active:scale-95"
                            >
                              <TechIcon tech="github" size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                              View Source
                            </a>
                          )}
                        </div>
                      )}

                      {/* Mac Window Media Container */}
                      <div
                        className="w-full rounded-lg overflow-hidden mb-8 border border-zinc-800 bg-zinc-900/60 relative shadow-2xl transition-all"
                        style={{ boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), 0 0 35px -10px ${project.accent}20` }}
                      >
                        {/* Chrome Header */}
                        <div className="w-full h-8 bg-zinc-900/90 border-b border-zinc-800/80 px-4 flex items-center justify-between select-none">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90 border border-[#e0443e]/40" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90 border border-[#dea123]/40" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90 border border-[#1aab29]/40" />
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 tracking-wider">
                            porto://projects/{project.slug}
                          </div>
                          <div className="w-10" />
                        </div>

                        {/* Media canvas */}
                        <div className="w-full aspect-video relative bg-black/40">
                          {(project.thumbnail.endsWith('.mp4') || project.thumbnail.endsWith('.webm')) ? (
                            <CulledVideo
                              src={project.thumbnail}
                              className="w-full h-full"
                            />
                          ) : (
                            <Image
                              src={project.thumbnail}
                              alt={`${project.title} preview`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 800px"
                            />
                          )}
                        </div>
                      </div>

                      {/* Engineering Specs Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 px-5 my-8 rounded-md bg-zinc-900/40 border border-zinc-800/80">
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">Domain</div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-200">{project.category}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">Timeline</div>
                          <div className="text-xs sm:text-sm font-mono text-zinc-300">{project.year}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">Core Tech</div>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">{project.stack.slice(0, 3).join(", ")}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">Status</div>
                          <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Completed
                          </div>
                        </div>
                      </div>

                      <div
                        className="w-full prose max-sm:!text-[11px] prose-sm md:prose-base prose-invert prose-zinc max-w-none prose-headings:text-zinc-100 prose-h1:max-sm:text-xl prose-h2:max-sm:text-[17px] prose-h3:max-sm:text-[14px] prose-p:text-zinc-400 prose-strong:text-zinc-200 prose-li:text-zinc-400 prose-code:before:content-none prose-code:after:content-none prose-pre:p-0 prose-pre:bg-transparent hover:prose-a:opacity-80 min-h-[50vh]"
                        style={{
                          "--theme-color": project.accent,
                          "--tw-prose-links": project.accent,
                          paddingBottom: "calc(2rem + 46px + 1rem)",
                        } as React.CSSProperties}
                      >
                        {Post ? <Post /> : <ArticleSkeleton />}
                      </div>
                    </div>
                  </article>
                </div>

                {/* Back to Top */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                  <BackToTop scrollRef={scrollBodyRef} />
                </div>
              </div>

              {/* Right: Fixed Sidebar (Scrolls independently if content overflows) */}
              <aside className="w-full lg:w-72 xl:w-80 h-auto lg:h-full shrink-0 bg-zinc-950 overflow-y-auto no-scrollbar mr-12" data-lenis-prevent="true">
                <div className="p-6 sm:p-8 pt-12 sm:pt-16 flex flex-col gap-4 pb-12 animate-slide-up-fade" style={{ opacity: 0 }}>
                  <LangToggle />

                  {/* Reading Progress Indicator */}
                  <ReadingProgressBar scrollRef={scrollBodyRef} accent={project.accent} />

                  {/* Metadata Section */}
                  <div className="flex flex-col gap-4 p-4 rounded-md bg-zinc-900/40 border border-zinc-800/80">
                    <div>
                      <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">Category</h3>
                      <p className="text-xs font-semibold text-zinc-200">{project.category}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">Year</h3>
                      <p className="text-xs font-mono text-zinc-400">{project.year}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Technologies</h3>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {project.stack.map((tech: string) => (
                          <div key={tech} className="group relative flex items-center justify-center cursor-default">
                            <TechIcon tech={tech} size={17} className="text-zinc-400 group-hover:text-white transition-colors" />
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded-sm shadow-xl whitespace-nowrap z-50">
                              {tech}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Table of Contents */}
                  {Post && <TableOfContents accent={project.accent} slug={project.slug} scrollRef={scrollBodyRef} />}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
