"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { ProjectMeta } from "@/lib/projects";
import type { GithubGraphDay } from "@/lib/github";
import FolderSection from "@/components/layout/FolderSection";
import AboutSection from "@/app/(home)/_components/about/AboutSection";
import ExperienceSection from "@/app/(home)/_components/experience/ExperienceSection";
import ProjectsSection from "@/app/(home)/_components/projects/ProjectsSection";
import Footer from "@/components/layout/Footer";
import { getParallaxSeamExtension } from "@/components/layout/stackGeometry";
import { useStackedSectionGeometry } from "@/hooks/useStackedSectionGeometry";

const STACK_TOPS = {
	about: { mobile: 48, desktop: 80 },
	experience: { mobile: 88, desktop: 120 },
	projects: { mobile: 128, desktop: 160 },
} as const;

const SECTION_CONTENT_PADDING = "py-16 md:py-24";

interface StackedSectionsProps {
	projects: ProjectMeta[];
	isReady?: boolean;
	githubGraph: GithubGraphDay[][];
}

export default function StackedSections({ projects, isReady = true, githubGraph }: StackedSectionsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const aboutAnchorRef = useRef<HTMLDivElement>(null);
	const aboutRootRef = useRef<HTMLDivElement>(null);
	const experienceAnchorRef = useRef<HTMLDivElement>(null);
	const experienceRootRef = useRef<HTMLDivElement>(null);
	const projectsAnchorRef = useRef<HTMLDivElement>(null);
	const projectsRootRef = useRef<HTMLDivElement>(null);
	const {
		stackProgress,
		aboutFade,
		experienceFade,
		dockModes,
		viewportProbeRef,
	} = useStackedSectionGeometry({
		containerRef,
		about: { anchorRef: aboutAnchorRef, rootRef: aboutRootRef },
		experience: { anchorRef: experienceAnchorRef, rootRef: experienceRootRef },
		projects: { anchorRef: projectsAnchorRef, rootRef: projectsRootRef },
	});

	return (
		/* FIXED: Pulled up by -mt-[56px] to hide the light blue behind the rounded corners */
		<motion.div
			ref={containerRef}
			id="stacked-sections"
			className="relative z-9999 w-full -mt-14 mb-0"
			initial={{ y: 200 }}
			animate={isReady ? { y: 0 } : { y: 200 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0 }}
		>
			<div ref={viewportProbeRef} className="absolute h-svh w-0 invisible pointer-events-none" aria-hidden="true" />
			<FolderSection
				tabTitle="About"
				tabPosition="left"
				bgClass="bg-[#141416]"
				fillClass="fill-[#141416]"
				stackTop={STACK_TOPS.about}
				dockMode={dockModes.about}
				anchorRef={aboutAnchorRef}
				rootRef={aboutRootRef}
				scrollYProgress={stackProgress}
				customFadeProgress={aboutFade}
				parallaxOffset={-40}
				fadeRange={[0, 0.6]}
				bgBase="#09090b"
				bgFaded="#1c2029"
				pbClass="p-0"
			>
				<div data-folder-content className={`${SECTION_CONTENT_PADDING} min-h-0 flex flex-col`}>
					<AboutSection githubGraph={githubGraph} />
				</div>
			</FolderSection>

			<FolderSection
				tabTitle="Experience"
				tabPosition="center"
				bgClass="bg-[#0e0e10]"
				fillClass="fill-[#0e0e10]"
				stackTop={STACK_TOPS.experience}
				dockMode={dockModes.experience}
				anchorRef={experienceAnchorRef}
				rootRef={experienceRootRef}
				scrollYProgress={stackProgress}
				customFadeProgress={experienceFade}
				parallaxOffset={-60}
				seamExtension={getParallaxSeamExtension(-60, 0)}
				fadeRange={[0.4, 1]}
				bgBase="#09090b"
				bgFaded="#161820ff"
				overlapPrevious
				pbClass="p-0"
			>
				<div data-folder-content className={`${SECTION_CONTENT_PADDING} min-h-0 flex flex-col`}>
					<div data-folder-content-clip className="min-h-0 flex-1 overflow-hidden">
						<ExperienceSection />
					</div>
				</div>
			</FolderSection>

			<FolderSection
				tabTitle="Projects"
				tabPosition="right"
				bgClass="bg-zinc-950"
				fillClass="fill-zinc-950"
				stackTop={STACK_TOPS.projects}
				dockMode="flow"
				anchorRef={projectsAnchorRef}
				rootRef={projectsRootRef}
				scrollYProgress={stackProgress}
				parallaxOffset={0}
				bgBase="#09090b"
				overlapPrevious
				pbClass="p-0"
			>
				<div className="flex flex-col justify-between w-full">
					<div data-folder-content className={SECTION_CONTENT_PADDING}>
						<ProjectsSection projects={projects} />
					</div>
					<div className="w-full">
						<Footer />
					</div>
				</div>
			</FolderSection>
		</motion.div>
	);
}
