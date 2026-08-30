"use client";

import { useEffect, useCallback, useState, useRef, useSyncExternalStore } from "react";
import { useLenis } from "lenis/react";
import NProgress from "nprogress";
import Image from "next/image";
import { useInView } from "framer-motion";
import { Gamepad2, ExternalLink } from "lucide-react";
import type { ProjectMeta } from "@/lib/projects";
import BackToTop from "@/components/shared/BackToTop";
import TechIcon from "@/components/shared/TechIcon";
import LangToggle from "@/components/shared/LangToggle";

const subscribeToProjectSlug = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  window.addEventListener("project-modal-changed", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("project-modal-changed", callback);
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

function TableOfContents({ accent, slug }: { accent: string; slug: string }) {
  const [activeId, setActiveId] = useState<string>("");
  const [headings, setHeadings] = useState<TocItem[]>([]);

  useEffect(() => {
    // Wait a tick for MDX to finish rendering
    const timeout = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll(".prose h2, .prose h3"));
      const items = elements.map((elem) => ({
        id: elem.id,
        text: elem.textContent || "",
        level: Number(elem.tagName.substring(1)),
      })).filter(item => item.id);

      setHeadings(items);

      if (items.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: "0% 0px -80% 0px" }
      );

      elements.forEach((elem) => observer.observe(elem));
      return () => observer.disconnect();
    }, 150);

    return () => clearTimeout(timeout);
  }, [slug]);

  if (headings.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-lg bg-zinc-800/20">
      <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Contents</h3>
      <nav className="flex flex-col gap-3">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(heading.id);
              if (target) {
                // Find scroll container and scroll it
                const scrollContainer = document.querySelector('[data-lenis-prevent="true"]');
                if (scrollContainer) {
                  const top = target.getBoundingClientRect().top + scrollContainer.scrollTop - 80;
                  scrollContainer.scrollTo({ top, behavior: "smooth" });
                } else {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }
            }}
            className={`text-[13px] transition-colors line-clamp-1 ${activeId === heading.id
              ? "font-medium"
              : "text-zinc-500 hover:text-zinc-300"
              }`}
            style={{
              paddingLeft: heading.level === 3 ? "1rem" : "0",
              color: activeId === heading.id ? accent : undefined
            }}
          >
            {heading.text}
          </a>
        ))}
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
      // Start exit animation
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
      return;
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
  }, [slug, lenis, allProjects]);

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
  };

  const prevProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < 0) return;
    const prevIdx = (currentIndex - 1 + totalProjects) % totalProjects;
    const prevSlug = allProjects[prevIdx].slug;
    const newUrl = (typeof window !== "undefined" ? window.location.pathname : "/") + "#project=" + prevSlug;
    window.history.pushState(null, "", newUrl);
    window.dispatchEvent(new Event("project-modal-changed"));
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
          margin: 1.5rem 0;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          background: #0d1117;
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
                      {/* Project Thumbnail / Video */}
                      <div className="w-full aspect-video rounded-xl overflow-hidden mb-8 sm:mb-10 border border-zinc-800 bg-zinc-900/50 relative shadow-2xl">
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

                      <h1 className="text-[24px] sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 tracking-tight" style={{ color: project.accent }}>
                        {project.title}
                      </h1>

                      <p className="text-[13px] sm:text-base md:text-lg text-zinc-400 leading-relaxed mb-8 sm:mb-12">
                        {project.description}
                      </p>

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
                <div className="p-6 sm:p-8 pt-12 sm:pt-16 flex flex-col gap-3 pb-12 animate-slide-up-fade" style={{ opacity: 0 }}>
                  <LangToggle />
                  {/* Metadata Section */}
                  <div className="flex flex-col gap-5 p-5 rounded-lg bg-zinc-800/20">
                    <div>
                      <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Category</h3>
                      <p className="text-sm font-medium text-zinc-200">{project.category}</p>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Year</h3>
                      <p className="text-sm font-mono text-zinc-400">{project.year}</p>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Technologies</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        {project.stack.map((tech: string) => (
                          <div key={tech} className="group relative flex items-center justify-center cursor-default">
                            <TechIcon tech={tech} size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded shadow-xl whitespace-nowrap z-50">
                              {tech}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* External Links */}
                    {(project.github || (project.links && project.links.length > 0)) && (
                      <div>
                        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Links</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          {project.github && (!project.links || project.links.length === 0) && (
                            <a
                              href={project.github}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 transition-colors text-xs text-zinc-300 hover:text-white"
                            >
                              <TechIcon tech="github" size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                              Source Code
                            </a>
                          )}
                          {project.links?.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 transition-colors text-xs text-zinc-300 hover:text-white"
                            >
                              {link.icon === "gamepad" ? (
                                <Gamepad2 className="w-3.5 h-3.5" style={{ color: project.accent }} />
                              ) : link.icon === "github" ? (
                                <TechIcon tech="github" size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                              ) : (
                                <ExternalLink className="w-3.5 h-3.5" style={{ color: project.accent }} />
                              )}
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Table of Contents */}
                  {Post && <TableOfContents accent={project.accent} slug={project.slug} />}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
