"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useCallback, useState, Suspense } from "react";
import { useLenis } from "@studio-freight/react-lenis";
import { getAllProjects, type ProjectMeta } from "@/lib/projects";

/* ── Preload all MDX components at module level ────────────── */
const mdxModules: Record<string, React.ComponentType> = {};

function ProjectModalContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("project");
  const lenis = useLenis();

  const [Post, setPost] = useState<React.ComponentType | null>(null);
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load MDX content when slug changes
  useEffect(() => {
    if (!slug) {
      // Start exit animation
      setIsAnimating(false);
      const timer = setTimeout(() => setIsOpen(false), 350);
      return () => clearTimeout(timer);
    }

    const proj = getAllProjects().find((p) => p.slug === slug);
    if (!proj) return;

    setProject(proj);
    setIsOpen(true);

    // Load MDX dynamically
    if (mdxModules[slug]) {
      setPost(() => mdxModules[slug]);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      import(`@/content/projects/${slug}.mdx`).then((mod) => {
        mdxModules[slug] = mod.default;
        setPost(() => mod.default);
        requestAnimationFrame(() => setIsAnimating(true));
      });
    }
  }, [slug]);

  // Lock/unlock body scroll
  useEffect(() => {
    if (isAnimating) {
      if (lenis) lenis.stop();
      document.body.style.overflow = "hidden";
    } else if (!slug) {
      if (lenis) lenis.start();
      document.body.style.overflow = "";
    }
  }, [isAnimating, lenis, slug]);

  const close = useCallback(() => {
    window.history.pushState(null, "", window.location.pathname);
    // Manually trigger state update since pushState doesn't fire popstate
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      if (lenis) lenis.start();
      document.body.style.overflow = "";
    }, 350);
  }, [lenis]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [close]);

  // Handle browser back button AND pushState from card clicks
  useEffect(() => {
    const handlePop = () => {
      const params = new URLSearchParams(window.location.search);
      const newSlug = params.get("project");
      if (!newSlug) {
        setIsAnimating(false);
        setTimeout(() => {
          setIsOpen(false);
          if (lenis) lenis.start();
          document.body.style.overflow = "";
        }, 350);
      } else {
        // Opening a project
        const proj = getAllProjects().find((p) => p.slug === newSlug);
        if (!proj) return;
        setProject(proj);
        setIsOpen(true);

        if (mdxModules[newSlug]) {
          setPost(() => mdxModules[newSlug]);
          requestAnimationFrame(() => setIsAnimating(true));
        } else {
          import(`@/content/projects/${newSlug}.mdx`).then((mod) => {
            mdxModules[newSlug] = mod.default;
            setPost(() => mod.default);
            requestAnimationFrame(() => setIsAnimating(true));
          });
        }
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [lenis]);

  if (!isOpen || !project || !Post) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:px-6">
      {/* Backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        style={{ opacity: isAnimating ? 1 : 0 }}
      />

      {/* Modal Container — Pure CSS animation */}
      <div
        className="relative w-full h-[92dvh] max-w-6xl bg-zinc-950 rounded-t-3xl border border-b-0 border-zinc-800 flex flex-col overflow-hidden transition-transform"
        style={{
          transform: isAnimating ? "translateY(0)" : "translateY(100%)",
          transitionDuration: isAnimating ? "600ms" : "400ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Close Button */}
        <div className="absolute top-0 right-0 z-20 p-5 pointer-events-none">
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
          <article className="min-h-full bg-zinc-950 text-zinc-200 flex flex-col">
            {/* Header: Text Left, Video Right */}
            <header className="w-full max-w-5xl mx-auto px-6 pt-12 sm:pt-16 pb-10 border-b border-zinc-800/50">
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
                        <span key={tech} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800/80 text-zinc-300 flex items-center gap-1.5 transition-colors hover:bg-zinc-800">
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
                  <div className="w-full aspect-video bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden relative group">
                    <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all cursor-pointer">
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
              className="flex-1 w-full px-6 py-10 sm:py-12 pb-32 prose prose-invert prose-zinc max-w-5xl mx-auto prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-strong:text-zinc-200 prose-li:text-zinc-400 hover:prose-a:opacity-80 transition-all"
              style={{ "--tw-prose-links": project.accent } as React.CSSProperties}
            >
              <Post />
            </div>
          </article>
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
