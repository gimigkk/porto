import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProjectMeta } from "@/lib/projects";
import ProjectCards from "@/components/projects/ProjectCards";
import styles from "@/components/home/SkipIntroButton.module.css";

export default function ProjectsSection({ projects }: { projects: ProjectMeta[] }) {

  return (
    <div className="w-full h-full flex flex-col items-center justify-center pt-4 pb-8">
      {/* -- Header ----------------------------------------------- */}
      <div className="w-full max-w-350 mx-auto hidden md:flex flex-row items-end justify-between gap-6 mb-8 px-12">
        <div className="text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Projects
          </h2>
          <p className="text-zinc-400 text-sm max-w-md">
            Gloat-worthy projects, experiments, and highlights from my development journey. Click a card to read more about it.
          </p>
        </div>
        <Link href="/projects" className={`${styles.pushable} group shrink-0`} aria-label="View Archive">
          <span className={styles.shadow}></span>
          <span className={styles.edge}></span>
          <span
            className={`${styles.front} !flex items-center justify-center gap-1 whitespace-nowrap`}
            style={{
              padding: "8px 16px",
              fontSize: "0.85rem"
            }}
          >
            <span>View Archive</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45" />
          </span>
        </Link>
      </div>

      {/* -- Cards (client component for animations) -------------- */}
      <ProjectCards projects={projects} />
    </div>
  );
}
