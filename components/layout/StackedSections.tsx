"use client";

import { useRef } from "react";
import { useScroll } from "framer-motion";
import type { ProjectMeta } from "@/lib/projects";
import FolderSection from "@/components/ui/FolderSection";
import AboutSection from "@/components/sections/AboutSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import ProjectsSection from "@/components/sections/ProjectsSection";

export default function StackedSections({ projects }: { projects: ProjectMeta[] }) {
	const containerRef = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	});

	return (
		<div ref={containerRef} className="relative z-20 w-full -mb-[80px]">
			<FolderSection
				tabTitle="About"
				tabPosition="left"
				bgClass="bg-[#141416]"
				fillClass="fill-[#141416]"
				stickyClass="h-[calc(100vh-5rem)] sticky top-20"
				scrollYProgress={scrollYProgress}
				parallaxOffset={-40}
				scrollOffset={-80}
				fadeRange={[0, 0.5]}
				fadeAmount={1.2}
			>
				<AboutSection />
			</FolderSection>

			<FolderSection
				tabTitle="Experience"
				tabPosition="center"
				bgClass="bg-[#0e0e10]"
				fillClass="fill-[#0e0e10]"
				stickyClass="h-[calc(100vh-120px)] sticky top-[120px]"
				scrollYProgress={scrollYProgress}
				parallaxOffset={-60}
				scrollOffset={-120}
				fadeRange={[0.5, 1]}
				fadeAmount={1.2}
			>
				<ExperienceSection />
			</FolderSection>

			<FolderSection
				tabTitle="Projects"
				tabPosition="right"
				bgClass="bg-zinc-950"
				fillClass="fill-zinc-950"
				stickyClass="min-h-[calc(100vh-160px)] z-30 relative"
				scrollYProgress={scrollYProgress}
				parallaxOffset={-80}
				scrollOffset={-160}
			>
				<ProjectsSection projects={projects} />
			</FolderSection>
		</div>
	);
}
