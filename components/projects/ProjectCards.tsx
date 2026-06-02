"use client";

import { useState, useCallback } from "react";
import type { ProjectMeta } from "@/lib/projects";
import { FileText, ChevronRight } from "lucide-react";
import TechIcon from "@/components/ui/TechIcon";

/* ── Max cards shown in the folder highlight ──────────────────── */
const MAX_FEATURED = 6;

export default function ProjectCards({
  projects,
}: {
  projects: ProjectMeta[];
}) {
  const featured = projects.slice(0, MAX_FEATURED);
  const hasMore = projects.length > MAX_FEATURED;

  /* ── Track which card is hovered (null = none) ────────────── */
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <>
      {/* ── Cards Grid (3-column) ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-[1400px] mx-auto px-4 md:px-12">
        {featured.map((project, i) => (
          <div
            key={project.slug}
            className="group relative w-full h-full transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hover:z-50"
            style={{
              perspective: "1000px",
              opacity: hoveredSlug === null || hoveredSlug === project.slug ? 1 : 0.8,
              filter: hoveredSlug === null || hoveredSlug === project.slug ? "none" : "saturate(0.8h)",
            }}
            onMouseEnter={() => setHoveredSlug(project.slug)}
            onMouseLeave={() => setHoveredSlug(null)}
          >
            {/* Background Documents (Pop-up effect) — hidden on mobile */}
            <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
              {/* File 1 (Back, goes highest) */}
              <div 
                className="absolute top-10 left-[12%] right-[12%] bottom-16 rounded-xl border border-zinc-700/50 bg-zinc-800 shadow-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-24 group-hover:-rotate-3 origin-bottom"
              >
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-1.5 w-1/3 bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-full bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-2/3 bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-4/5 bg-zinc-600 rounded-full"></div>
                </div>
              </div>
              {/* File 2 (Middle) */}
              <div 
                className="absolute top-8 left-[8%] right-[8%] bottom-12 rounded-xl border border-black/20 shadow-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-12 group-hover:rotate-3 origin-bottom delay-75"
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

            {/* Main Card Front */}
            <div
              onClick={() => {
                window.history.pushState(null, "", `?project=${project.slug}`);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="relative z-10 flex flex-col h-full rounded-xl border border-zinc-700/60 bg-zinc-900 overflow-hidden no-underline cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom md:group-hover:[transform:translateY(16px)_rotateX(-6deg)]"
              style={{
                willChange: "transform"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(161,161,170,0.45)";
                e.currentTarget.style.boxShadow = `0 0 28px 0 ${project.accent}18`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              {/* ── Thumbnail ────────────────────────────────────── */}
              <div className="relative w-full aspect-[2.6/1] bg-zinc-900 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.thumbnail}
                  alt={`${project.title} preview`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* ── Card body ───────────────────────────────────────── */}
              <div className="flex flex-col flex-1 p-3">
                {/* Category + Year row */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    {project.category}
                  </span>
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      color: project.accent,
                      borderColor: `${project.accent}33`,
                      backgroundColor: `${project.accent}11`,
                    }}
                  >
                    {project.year}
                  </span>
                </div>

                {/* Title + arrow */}
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
                  <h3
                    className="text-base font-bold md:group-hover:brightness-125"
                    style={{
                      color: project.accent,
                      transition: "filter 0.3s",
                    }}
                  >
                    {project.title}
                  </h3>
                  <ChevronRight 
                    className="w-4 h-4 ml-auto shrink-0 text-zinc-600 md:opacity-0 md:-translate-x-1 md:group-hover:opacity-100 md:group-hover:translate-x-0"
                    style={{ transition: "opacity 0.3s, transform 0.3s" }}
                    strokeWidth={2}
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-snug mb-2 flex-1 line-clamp-2">
                  {project.description}
                </p>

                {/* Tech stack & Links */}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-700/40">
                  <div className="flex flex-wrap items-center gap-2">
                    {project.stack.map((tech) => (
                      <TechIcon
                        key={tech}
                        tech={tech}
                        size={16}
                        className="text-zinc-400 hover:text-white transition-colors"
                      />
                    ))}
                  </div>

                  {/* GitHub Button */}
                  <a
                    href={project.github ?? `https://github.com/gimigkk/${project.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto flex items-center justify-center w-[22px] h-[22px] rounded-[5px] border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400 transition-colors z-20 shrink-0"
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

      {/* ── View All link ──────────────────────────────────────── */}
      {hasMore && (
        <a
          href="/projects"
          className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          View all {projects.length} projects
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
      )}
    </>
  );
}
