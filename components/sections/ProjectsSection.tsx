import { getAllProjects } from "@/lib/projects";
import ProjectCards from "./ProjectCards";

export default function ProjectsSection() {
  const projects = getAllProjects();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center pt-4 pb-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
          Projects
        </h2>
        <p className="text-zinc-400 text-base max-w-md mx-auto">
          A selection of things I&apos;ve built — from platforms to pixels.
        </p>
      </div>

      {/* ── Cards (client component for animations) ────────────── */}
      <ProjectCards projects={projects} />
    </div>
  );
}
