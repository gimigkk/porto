"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import type { ProjectMeta } from "@/lib/projects";
import { ChevronRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import TechIcon from "@/components/shared/TechIcon";
import styles from "@/components/home/SkipIntroButton.module.css";

function CulledVideo({ src, className }: { src: string, className?: string }) {
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
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

/* -- Max cards shown in the folder highlight -------------------- */
const MAX_FEATURED = 6;

export default function ProjectCards({
  projects,
}: {
  projects: ProjectMeta[];
}) {
  const featured = projects.slice(0, MAX_FEATURED);
  const hasMore = projects.length >= MAX_FEATURED;

  return (
    <div className="relative w-full max-w-350 mx-auto pb-20">
      {/* -- Cards Grid (3-column) ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-3 px-3 md:px-12">
        {featured.map((project) => (
          <div
            key={project.slug}
            className="group relative w-full h-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] md:hover:z-50"
            style={{ perspective: "1000px" }}
          >
            {/* Background Documents (Pop-up effect) — hidden on mobile */}
            <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
              <div className="absolute top-10 left-[12%] right-[12%] bottom-16 rounded-lg border border-zinc-700/50 bg-zinc-800 shadow-xl transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-24 group-hover:-rotate-3 origin-bottom">
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-1.5 w-1/3 bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-full bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-2/3 bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-4/5 bg-zinc-600 rounded-full"></div>
                </div>
              </div>
              <div
                className="absolute top-8 left-[8%] right-[8%] bottom-12 rounded-lg border border-black/20 shadow-xl transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-12 group-hover:rotate-3 origin-bottom delay-75"
                style={{ backgroundColor: project.accent }}
              >
                <div className="p-5 flex flex-col gap-3 mix-blend-overlay opacity-80">
                  <div className="h-1.5 w-1/4 bg-white rounded-full"></div>
                  <div className="h-1.5 w-4/5 bg-white rounded-full"></div>
                  <div className="h-1.5 w-1/2 bg-white rounded-full"></div>
                  <div className="h-1.5 w-full bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <div
              onClick={() => {
                window.history.pushState(null, "", `?project=${project.slug}`);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="relative z-10 flex flex-col md:justify-end md:aspect-video md:rounded-lg md:bg-zinc-900 overflow-hidden no-underline cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom md:group-hover:transform-[translateY(13px)_rotateX(-6deg)]"
              style={{ willChange: "transform" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(161,161,170,0.45)";
                e.currentTarget.style.boxShadow = "0 20px 50px -12px rgba(0,0,0,0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              {/* -- Thumbnail -- */}
              {/* Mobile: in-flow 16:9 rounded | Desktop: absolute fill */}
              <div className="relative aspect-video rounded-lg md:rounded-none md:absolute md:inset-0 md:aspect-auto md:h-full w-full shrink-0 overflow-hidden">
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
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>

              {/* -- Desktop-only overlays -- */}
              <div className="hidden md:block absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_top,black_5%,transparent_50%)]">
                {(project.thumbnail.endsWith('.mp4') || project.thumbnail.endsWith('.webm')) ? (
                  <CulledVideo
                    src={project.thumbnail}
                    className="absolute inset-0 w-full h-full blur-[3px] scale-[1.02]"
                  />
                ) : (
                  <Image
                    src={project.thumbnail}
                    alt=""
                    fill
                    sizes="33vw"
                    className="object-cover blur-[3px] scale-[1.02]"
                  />
                )}
              </div>
              <div className="hidden md:block absolute inset-x-0 bottom-0 h-1/2 rounded-[inherit] bg-linear-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
              {/* -- Meta -- */}
              <div className="relative z-10 flex flex-col px-1 pt-2 pb-1 md:p-3 md:pt-12">
                {/* Title row: title left, stack right (mobile) | title + chevron (desktop) */}
                <div className="flex items-center gap-2 mb-1 md:mb-1">
                  <h3
                    className="text-sm md:text-base font-bold md:group-hover:brightness-125 text-white truncate md:line-clamp-2 md:whitespace-normal min-w-0"
                    style={{ transition: "filter 0.3s" }}
                  >
                    {project.title}
                  </h3>

                  {/* Tech stack — inline on mobile */}
                  <div className="md:hidden flex items-center gap-1.5 shrink-0 ml-auto overflow-hidden">
                    {project.stack.slice(0, 4).map((tech) => (
                      <TechIcon
                        key={tech}
                        tech={tech}
                        size={13}
                        className="text-zinc-500"
                      />
                    ))}
                  </div>

                  <ChevronRight
                    className="hidden md:block w-4 h-4 ml-auto shrink-0 text-zinc-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                    style={{ transition: "opacity 0.3s, transform 0.3s" }}
                    strokeWidth={2}
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 md:text-zinc-300 leading-snug mb-2 line-clamp-2">
                  {project.description}
                </p>

                {/* Tech stack — desktop full row */}
                <div className="hidden md:flex items-center gap-2 pt-1.5 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    {project.stack.map((tech) => (
                      <TechIcon
                        key={tech}
                        tech={tech}
                        size={14}
                        className="text-zinc-300 hover:text-white transition-colors"
                      />
                    ))}
                  </div>

                  {/* GitHub Button — desktop only */}
                  <a
                    href={project.github ?? `https://github.com/gimigkk/${project.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto flex items-center justify-center w-5.5 h-5.5 rounded-[5px] border border-zinc-500 text-zinc-300 hover:text-white hover:border-zinc-300 transition-colors z-20 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    title="View Source"
                  >
                    <TechIcon tech="github" size={13} className="text-inherit" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="absolute bottom-0 left-0 right-0 h-52 pointer-events-none flex flex-col justify-end items-center pb-8 z-50">
          <div className="absolute inset-x-0 top-0 bottom-20 bg-linear-to-t from-[#09090b] via-[#09090b]/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[#09090b]" />
          {/* Desktop view more link */}
          <a
            href="/projects"
            className="hidden md:flex pointer-events-auto relative z-10 items-center text-sm text-zinc-400 hover:text-white font-medium transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group hover:-translate-y-0.5"
          >
            <span>view more</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45 mt-0.5" />
          </a>

          {/* Mobile View Archive CTA */}
          <Link href="/projects" className={`md:hidden ${styles.pushable} group shrink-0 pointer-events-auto relative z-10`} aria-label="View Archive">
            <span className={styles.shadow}></span>
            <span className={styles.edge}></span>
            <span
              className={`${styles.front} !flex items-center justify-center gap-1.5 whitespace-nowrap`}
              style={{
                padding: "6px 12px",
                fontSize: "0.75rem"
              }}
            >
              <span>View Archive</span>
              <ArrowRight className="w-3 h-3 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
