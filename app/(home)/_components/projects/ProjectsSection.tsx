import { ArrowRight } from "lucide-react";
import type { ProjectMeta } from "@/lib/projects";
import ProjectCards from "@/app/(home)/_components/projects/ProjectCards";
import PushButton from "@/components/ui/PushButton";

export default function ProjectsSection({ projects }: { projects: ProjectMeta[] }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* -- Header ----------------------------------------------- */}
      <div className="w-full max-w-[1400px] mx-auto hidden md:flex flex-row items-end justify-between gap-6 mb-8 px-12">
        <div className="text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Projects
          </h2>
          <p className="text-zinc-400 text-sm max-w-md">
            Gloat-worthy projects, experiments, and highlights from my development journey. Click a card to read more about it.
          </p>
        </div>
        <PushButton
          href="/projects"
          ariaLabel="View Project Archive"
          className="group shrink-0"
          frontStyle={{
            padding: "8px 16px",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            whiteSpace: "nowrap",
          }}
        >
          <span>View More</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45" />
        </PushButton>
      </div>

      {/* -- Cards (client component for animations) -------------- */}
      <ProjectCards projects={projects} />
    </div>
  );
}
