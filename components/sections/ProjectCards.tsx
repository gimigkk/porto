"use client";

import { motion } from "framer-motion";
import type { ProjectMeta } from "@/lib/projects";

/* ── Human-readable label for each skill icon ID ─────────────── */
const techLabel: Record<string, string> = {
  nextjs: "Next.js",
  ts: "TypeScript",
  react: "React",
  prisma: "Prisma",
  postgres: "PostgreSQL",
  tailwind: "Tailwind CSS",
  css: "CSS",
  nodejs: "Node.js",
  firebase: "Firebase",
  python: "Python",
  figma: "Figma",
  docker: "Docker",
  git: "Git",
};

/* ── Card animation variants ─────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

/* ── Max cards shown in the folder highlight ──────────────────── */
const MAX_FEATURED = 6;

export default function ProjectCards({
  projects,
}: {
  projects: ProjectMeta[];
}) {
  const featured = projects.slice(0, MAX_FEATURED);
  const hasMore = projects.length > MAX_FEATURED;

  return (
    <>
      {/* ── Cards Grid (3-column) ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-6xl">
        {featured.map((project, i) => (
          <motion.a
            key={project.slug}
            href={`/projects/${project.slug}`}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            className="group relative flex flex-col rounded-xl border border-zinc-700/60 bg-zinc-800/50 backdrop-blur-sm overflow-hidden no-underline"
            style={{ transition: "border-color 0.3s, box-shadow 0.3s" }}
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
                <svg
                  className="w-4 h-4 shrink-0 text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <h3
                  className="text-base font-bold group-hover:brightness-125"
                  style={{
                    color: project.accent,
                    transition: "filter 0.3s",
                  }}
                >
                  {project.title}
                </h3>
                <svg
                  className="w-4 h-4 ml-auto shrink-0 text-zinc-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                  style={{ transition: "opacity 0.3s, transform 0.3s" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-400 leading-snug mb-2 flex-1 line-clamp-2">
                {project.description}
              </p>

              {/* Tech stack — skillicons.dev (GitHub README style) */}
              <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2 border-t border-zinc-700/40">
                {project.stack.map((tech) => (
                  <div
                    key={tech}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-700/30"
                    title={techLabel[tech] ?? tech}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://skillicons.dev/icons?i=${tech}&theme=dark`}
                      alt={techLabel[tech] ?? tech}
                      className="w-4 h-4 rounded-sm"
                    />
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {techLabel[tech] ?? tech}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      {/* ── View All link ──────────────────────────────────────── */}
      {hasMore && (
        <motion.a
          href="/projects"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
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
        </motion.a>
      )}
    </>
  );
}
