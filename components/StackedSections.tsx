"use client";

import { useRef } from "react";
import FolderSection from "./FolderSection";
import AboutSection from "./sections/AboutSection";
import ExperienceSection from "./sections/ExperienceSection";
import ProjectsSection from "./sections/ProjectsSection";

export default function StackedSections() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative z-20 w-full">
      <FolderSection
        tabTitle="About"
        tabPosition="left"
        bgClass="bg-slate-900"
        fillClass="fill-slate-900"
        stickyClass="h-[calc(100vh-5rem)] sticky top-20"
      >
        <AboutSection />
      </FolderSection>

      <FolderSection
        tabTitle="Experience"
        tabPosition="center"
        bgClass="bg-zinc-800"
        fillClass="fill-zinc-800"
        stickyClass="h-[calc(100vh-120px)] sticky top-[120px]"
      >
        <ExperienceSection />
      </FolderSection>

      <FolderSection
        tabTitle="Projects"
        tabPosition="right"
        bgClass="bg-neutral-900"
        fillClass="fill-neutral-900"
        stickyClass="h-[calc(100vh-160px)] sticky top-[160px]"
      >
        <ProjectsSection />
      </FolderSection>
    </div>
  );
}
