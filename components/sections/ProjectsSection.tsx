import type { ProjectMeta } from "@/lib/projects";
import ProjectCards from "@/components/projects/ProjectCards";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function ProjectsSection({ projects }: { projects: ProjectMeta[] }) {

  return (
    <div className="w-full h-full flex flex-col items-center justify-center pt-4 pb-8">
      {/* -- Header ----------------------------------------------- */}
      <div className="w-full max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 px-4 md:px-12">
        <div className="text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Projects
          </h2>
          <p className="text-zinc-400 text-sm max-w-md">
            A selection of things I&apos;ve built — from platforms to pixels.
          </p>
        </div>
        <AnimatedButton href="/projects" className="shrink-0 sm">
          View Archive
        </AnimatedButton>
      </div>

      {/* -- Cards (client component for animations) -------------- */}
      <ProjectCards projects={projects} />
    </div>
  );
}
