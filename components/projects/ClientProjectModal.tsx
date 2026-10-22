"use client";

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import NProgress from "nprogress";
import { Gamepad2, ExternalLink, Video } from "lucide-react";
import type { ProjectMeta } from "@/lib/projects";
import TechIcon from "@/components/ui/TechIcon";
import BackToTop from "@/components/ui/BackToTop";
import ModalHeaderTabs from "./modal/ModalHeaderTabs";
import ModalMacWindow from "./modal/ModalMacWindow";
import ModalMetaStrip from "./modal/ModalMetaStrip";
import ModalSidebar from "./modal/ModalSidebar";
import ArticleSkeleton from "./modal/ArticleSkeleton";
import { useProjectSlug, navigateToProjectSlug } from "./modal/useProjectSlug";
import { useModalShortcutsAndLock } from "./modal/useModalShortcutsAndLock";
import styles from "./ClientProjectModal.module.css";

const mdxModules: Record<string, React.ComponentType> = {};

export default function ClientProjectModal({ projects: allProjects }: { projects: ProjectMeta[] }) {
  const slug = useProjectSlug();

  const [activeSlug, setActiveSlug] = useState<string | null>(slug);
  const [prevSlug, setPrevSlug] = useState<string | null>(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    if (slug) {
      setActiveSlug(slug);
    }
  }

  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const [loadedPost, setLoadedPost] = useState<React.ComponentType | null>(null);
  const Post = activeSlug && mdxModules[activeSlug]
    ? mdxModules[activeSlug]
    : loadedSlug === activeSlug
    ? loadedPost
    : null;

  const [isAnimating, setIsAnimating] = useState(false);
  const isClosingRef = useRef(false);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  const currentIndex = useMemo(() => {
    return allProjects.findIndex((p) => p.slug === activeSlug);
  }, [allProjects, activeSlug]);

  const project = currentIndex !== -1 ? allProjects[currentIndex] : null;

  useEffect(() => {
    if (!activeSlug) return;
    if (mdxModules[activeSlug]) return;

    let cancelled = false;
    NProgress.start();

    import(`@/content/projects/${activeSlug}.mdx`)
      .then((mod) => {
        mdxModules[activeSlug] = mod.default;
        if (!cancelled) {
          setLoadedSlug(activeSlug);
          setLoadedPost(() => mod.default);
        }
      })
      .catch((err) => {
        console.error("Failed to load project MDX:", err);
      })
      .finally(() => {
        NProgress.done();
      });

    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  useEffect(() => {
    if (slug) {
      isClosingRef.current = false;
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    }
  }, [slug]);

  const close = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsAnimating(false);
    setTimeout(() => {
      navigateToProjectSlug(null);
    }, 300);
  }, []);

  const navigateToProject = useCallback(
    (index: number) => {
      const nextIndex = (index + allProjects.length) % allProjects.length;
      navigateToProjectSlug(allProjects[nextIndex].slug);
    },
    [allProjects]
  );

  const onPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateToProject(currentIndex - 1);
  };

  const onNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateToProject(currentIndex + 1);
  };

  useModalShortcutsAndLock(Boolean(slug && project), close);

  if (!project && !activeSlug) return null;
  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-end justify-center"
      style={{ pointerEvents: isAnimating ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity cursor-pointer"
        style={{
          opacity: isAnimating ? 1 : 0,
          transitionDuration: isAnimating ? "300ms" : "200ms",
          transitionTimingFunction: isAnimating ? "cubic-bezier(0.16, 1, 0.3, 1)" : "ease-in",
          pointerEvents: isAnimating ? "auto" : "none",
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
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Folder Tabs */}
          <ModalHeaderTabs
            currentIndex={currentIndex}
            totalProjects={allProjects.length}
            isAnimating={isAnimating}
            onPrev={onPrev}
            onNext={onNext}
            onClose={close}
          />

          {/* Content Body */}
          <div
            className={`flex-1 w-full bg-zinc-950 border border-t-0 border-zinc-600 overflow-hidden relative z-20 flex flex-col ${
              isAnimating ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            {/* Top gap border bridge */}
            <div className="absolute top-0 left-[179px] right-[79px] h-[1px] bg-zinc-600 z-50 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-12 sm:h-16 bg-gradient-to-b from-zinc-950 to-transparent z-30 pointer-events-none transform-gpu" />

            <div className="flex-1 w-full h-full flex flex-col lg:flex-row overflow-hidden relative">
              {/* Left Column: Article & Media */}
              <div className="flex-1 h-full relative min-w-0">
                <div
                  ref={scrollBodyRef}
                  className="w-full h-full overflow-y-auto no-scrollbar"
                  data-lenis-prevent="true"
                >
                  <article
                    key={project.slug}
                    className="min-h-full bg-zinc-950 text-zinc-200 px-4 sm:px-8 md:px-12 py-12 sm:py-16"
                  >
                    <div
                      className="w-full max-w-3xl mx-auto animate-slide-up-fade"
                      style={{ opacity: 0 }}
                    >
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-[1.12] mb-4">
                        {project.title}
                      </h1>

                      <p className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                        {project.description}
                      </p>

                      {/* Quick Action Links */}
                      {((project.links && project.links.length > 0) || project.github) && (
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                          {project.links?.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.actionPillPrimary}
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
                              className={styles.actionPillSecondary}
                            >
                              <TechIcon
                                tech="github"
                                size={14}
                                className="text-zinc-400 group-hover:text-white transition-colors"
                              />
                              View Source
                            </a>
                          )}
                        </div>
                      )}

                      {/* Mac Window Preview */}
                      <ModalMacWindow
                        slug={project.slug}
                        title={project.title}
                        thumbnail={project.thumbnail}
                        accent={project.accent}
                      />

                      {/* Engineering Specs Strip */}
                      <ModalMetaStrip
                        category={project.category}
                        year={project.year}
                        stack={project.stack}
                      />

                      {/* MDX Article Content */}
                      <div
                        className={`prose prose-sm md:prose-base prose-invert prose-zinc ${styles.articleProse}`}
                        style={
                          {
                            "--theme-color": project.accent,
                            "--tw-prose-links": project.accent,
                            paddingBottom: "calc(2rem + 46px + 1rem)",
                          } as React.CSSProperties
                        }
                      >
                        {Post ? <Post /> : <ArticleSkeleton />}
                      </div>
                    </div>
                  </article>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                  <BackToTop scrollRef={scrollBodyRef} />
                </div>
              </div>

              {/* Right Column: Sidebar */}
              <ModalSidebar
                category={project.category}
                year={project.year}
                accent={project.accent}
                slug={project.slug}
                stack={project.stack}
                scrollRef={scrollBodyRef}
                hasPost={Boolean(Post)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
