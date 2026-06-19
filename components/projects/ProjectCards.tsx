"use client";

import type { ProjectMeta } from "@/lib/projects";
import { ChevronRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import TechIcon from "@/components/ui/TechIcon";

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-3 px-4 md:px-12">
        {featured.map((project) => (
          <div
            key={project.slug}
            className="group relative w-full h-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] md:hover:z-50"
            style={{
              perspective: "1000px",
            }}
          >
            {/* Background Documents (Pop-up effect) — hidden on mobile */}
            <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
              {/* File 1 (Back, goes highest) */}
              <div
                className="absolute top-10 left-[12%] right-[12%] bottom-16 rounded-lg border border-zinc-700/50 bg-zinc-800 shadow-xl transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-24 group-hover:-rotate-3 origin-bottom"
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

            {/* Main Card Front */}
            <div
              onClick={() => {
                window.history.pushState(null, "", `?project=${project.slug}`);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="relative z-10 flex flex-col justify-end h-full min-h-[300px] rounded-lg border border-zinc-700/60 bg-zinc-900 overflow-hidden no-underline cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom md:group-hover:transform-[translateY(13px)_rotateX(-6deg)]"
              style={{
                willChange: "transform"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(161,161,170,0.45)";
                e.currentTarget.style.boxShadow = `0 20px 50px -12px rgba(0,0,0,0.8)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              {/* -- Full-cover thumbnail -- */}
              <Image
                src={project.thumbnail}
                alt={`${project.title} preview`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* -- Gradient + blur overlay at bottom -- */}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
              {/* isolate needed so backdrop-filter survives parent's 3D transform + overflow:hidden */}
              <div className="absolute bottom-0 left-0 right-0 h-2/3 isolate">
                <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black_40%,transparent_100%)]" />
              </div>

              {/* -- Year badge — top right -- */}
              <span
                className="absolute top-2.5 right-2.5 z-20 text-[11px] font-mono px-2 py-0.5 rounded-full border backdrop-blur-sm bg-black/20"
                style={{
                  color: project.accent,
                  borderColor: `${project.accent}33`,
                }}
              >
                {project.year}
              </span>

              {/* -- Card body — pushed to bottom on top of overlay -- */}
              <div className="relative z-10 flex flex-col p-3 pt-12">
                {/* Category */}
                <div className="mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-300">
                    {project.category}
                  </span>
                </div>

                {/* Title + arrow */}
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="text-base font-bold md:group-hover:brightness-125 text-white"
                    style={{
                      transition: "filter 0.3s",
                    }}
                  >
                    {project.title}
                  </h3>
                  <ChevronRight
                    className="w-4 h-4 ml-auto shrink-0 text-zinc-400 md:opacity-0 md:-translate-x-1 md:group-hover:opacity-100 md:group-hover:translate-x-0"
                    style={{ transition: "opacity 0.3s, transform 0.3s" }}
                    strokeWidth={2}
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 leading-snug mb-2 line-clamp-2">
                  {project.description}
                </p>

                {/* Tech stack */}
                <div className="flex items-center gap-2 pt-1.5 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    {project.stack.map((tech) => (
                      <TechIcon
                        key={tech}
                        tech={tech}
                        size={16}
                        className="text-zinc-300 hover:text-white transition-colors"
                      />
                    ))}
                  </div>

                  {/* GitHub Button */}
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
          <a
            href="/projects"
            className="pointer-events-auto relative z-10 flex items-center text-sm text-zinc-400 hover:text-white font-medium transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group hover:-translate-y-0.5"
          >
            <span>view more</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45 mt-0.5" />
          </a>
        </div>
      )}
    </div>
  );
}
