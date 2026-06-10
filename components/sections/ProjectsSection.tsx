import type { ProjectMeta } from "@/lib/projects";
import ProjectCards from "@/components/projects/ProjectCards";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function ProjectsSection({ projects }: { projects: ProjectMeta[] }) {

  return (
    <div className="w-full h-full flex flex-col items-center justify-center pt-4 pb-8">
      {/* -- Header ----------------------------------------------- */}
      <div className="w-full max-w-350 mx-auto flex flex-row items-end justify-between gap-4 md:gap-6 mb-4 md:mb-8 px-4 md:px-12">
        <div className="text-left">
          {/* Mobile: pill matching animated button silhouette, inverted */}
          <span className="md:!hidden animated-button sm inverted">
            <span className="text">PROJECTS</span>
          </span>
          <h2 className="hidden md:block text-3xl md:text-4xl font-bold text-white mb-2">
            Projects
          </h2>
          <p className="text-zinc-400 text-sm max-w-md hidden md:block">
            Gloat-worthy projects, experiments, and highlights from my development journey. Click a card to read more about it.
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
