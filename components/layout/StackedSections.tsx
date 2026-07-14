"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValue, type MotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import type { ProjectMeta } from "@/lib/projects";
import type { GithubGraphDay } from "@/lib/github";
import FolderSection from "@/components/layout/FolderSection";
import AboutSection from "@/app/(home)/_components/about/AboutSection";
import ExperienceSection from "@/app/(home)/_components/experience/ExperienceSection";
import ProjectsSection from "@/app/(home)/_components/projects/ProjectsSection";

interface StackedSectionsProps {
	projects: ProjectMeta[];
	isReady?: boolean;
	githubGraph: GithubGraphDay[][];
}

export default function StackedSections({ projects, isReady = true, githubGraph }: StackedSectionsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isMobile, setIsMobile] = useState(false);
	const mobileProgress = useMotionValue(0);
	const mobileAboutFade = useMotionValue(0);
	const mobileExpFade = useMotionValue(0);

	// Detect mobile viewport — never touch desktop path
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 768px)");
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsMobile(mq.matches);
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// Desktop: framer-motion useScroll — unmodified
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	});

	// ASCII clouds are now persistent bg (SkyBackground) — pause/resume removed.
	// They animate freely behind opaque folders for parallax effect.
	const effectiveProgress: MotionValue<number> = isMobile ? mobileProgress : scrollYProgress;

	// Mobile: Lenis-driven scroll progress (useScroll goes stale with sticky + Lenis)
	const lenis = useLenis();

	useEffect(() => {
		if (!isMobile) return;


		let cachedVh = 0;
		let cachedDocTop = 0;
		const el = containerRef.current;

		const updateMetrics = () => {
			if (!el) return;
			cachedVh = window.innerHeight;
			cachedDocTop = el.getBoundingClientRect().top + window.scrollY;
		};

		// Initialize metrics
		updateMetrics();
		window.addEventListener("resize", updateMetrics);
		
		let timeoutId: NodeJS.Timeout;
		if (isReady) {
			timeoutId = setTimeout(updateMetrics, 1500); // Re-cache after hero animation settles
		}

		const onScroll = () => {
			if (!el) return;
			// Use cached doc top to avoid forced synchronous layout per frame
			const currentTop = cachedDocTop - window.scrollY;
			
			// About folder docks at top-12 (48px). Start progress exactly here.
			const scrolled = 48 - currentTop;

			// Projects reaches its natural header position (128px) after 2*vh - 216px of scroll
			const totalStackScroll = Math.max(1, (2 * cachedVh) - 216);

			// Global parallax completes exactly when Projects arrives
			mobileProgress.set(Math.max(0, Math.min(1, scrolled / totalStackScroll)));

			// Experience docks at top-[88px], exactly when scrolled = cachedVh - 88
			const scrollAboutDock = Math.max(1, cachedVh - 88);
			mobileAboutFade.set(Math.max(0, Math.min(1, scrolled / scrollAboutDock)));
			
			// Experience fades from when it docks, until Projects arrives
			const expP = (scrolled - scrollAboutDock) / (totalStackScroll - scrollAboutDock);
			mobileExpFade.set(Math.max(0, Math.min(1, expP)));
		};

		if (lenis) lenis.on("scroll", onScroll);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll(); // set initial value

		return () => {
			if (lenis) lenis.off("scroll", onScroll);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", updateMetrics);
			clearTimeout(timeoutId);
		};
	}, [lenis, isMobile, isReady, mobileProgress, mobileAboutFade, mobileExpFade]);

	return (
		/* FIXED: Pulled up by -mt-[56px] to hide the light blue behind the rounded corners */
		<motion.div
			ref={containerRef}
			id="stacked-sections"
			className="relative z-9999 w-full -mt-14 -mb-20"
			initial={{ y: 200 }}
			animate={isReady ? { y: 0 } : { y: 200 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0 }}
		>
			<FolderSection
				tabTitle="About"
				tabPosition="left"
				bgClass="bg-[#141416]"
				fillClass="fill-[#141416]"
				stickyClass="h-[calc(100svh-3rem)] md:h-[calc(100svh-5rem)] sticky top-12 md:top-20"
				scrollYProgress={effectiveProgress}
				customFadeProgress={isMobile ? mobileAboutFade : undefined}
				parallaxOffset={-40}
				scrollOffset={-80}
				fadeRange={[0, 0.6]}
				bgBase="#09090b"
				bgFaded="#1c2029"
			>
				<AboutSection githubGraph={githubGraph} />
			</FolderSection>

			<FolderSection
				tabTitle="Experience"
				tabPosition="center"
				bgClass="bg-[#0e0e10]"
				fillClass="fill-[#0e0e10]"
				stickyClass="h-[calc(100svh-88px)] md:h-[calc(100svh-120px)] sticky top-[88px] md:top-[120px]"
				scrollYProgress={effectiveProgress}
				customFadeProgress={isMobile ? mobileExpFade : undefined}
				parallaxOffset={-60}
				scrollOffset={-120}
				fadeRange={[0.4, 1]}
				bgBase="#09090b"
				bgFaded="#161820ff"
			>
				<ExperienceSection />
			</FolderSection>

			<FolderSection
				tabTitle="Projects"
				tabPosition="right"
				bgClass="bg-zinc-950"
				fillClass="fill-zinc-950"
				stickyClass="min-h-[calc(100svh-128px)] md:min-h-[calc(100svh-160px)] z-30 relative"
				scrollYProgress={effectiveProgress}
				parallaxOffset={-80}
				scrollOffset={-160}
				bgBase="#09090b"
			>
				<ProjectsSection projects={projects} />
			</FolderSection>
		</motion.div>
	);
}