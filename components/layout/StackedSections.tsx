"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValue, type MotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import type { ProjectMeta } from "@/lib/projects";
import FolderSection from "@/components/ui/FolderSection";
import AboutSection from "@/components/sections/AboutSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import ProjectsSection from "@/components/sections/ProjectsSection";

interface StackedSectionsProps {
	projects: ProjectMeta[];
	isReady?: boolean;
}

export default function StackedSections({ projects, isReady = true }: StackedSectionsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isMobile, setIsMobile] = useState(false);
	const mobileProgress = useMotionValue(0);

	// Detect mobile viewport — never touch desktop path
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 768px)");
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
    if (!lenis || !isMobile) return;

    let cachedTop = 0;
    let cachedHeight = 0;
    let cachedVh = 0;
    const el = containerRef.current;

    const updateMetrics = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      cachedTop = rect.top + window.scrollY;
      cachedHeight = rect.height;
      cachedVh = window.innerHeight;
    };

    // Initialize metrics
    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    const onScroll = () => {
      if (!el) return;
      const distance = cachedHeight - cachedVh;
      if (distance <= 0) {
        mobileProgress.set(0);
        return;
      }
      
      const currentScrollY = window.scrollY || lenis.scroll || 0;
      const currentTop = cachedTop - currentScrollY;
      
      mobileProgress.set(Math.max(0, Math.min(1, -currentTop / distance)));
    };

    lenis.on("scroll", onScroll);
    onScroll(); // set initial value

    return () => {
      lenis.off("scroll", onScroll);
      window.removeEventListener("resize", updateMetrics);
    };
  }, [lenis, isMobile, mobileProgress]);

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
				stickyClass="h-[calc(100svh-5rem)] sticky top-20"
				scrollYProgress={effectiveProgress}
				parallaxOffset={-40}
				scrollOffset={-80}
				fadeRange={[0, 0.6]}
				bgBase="#141416"
				bgFaded="#1c2029"
			>
				<AboutSection />
			</FolderSection>

			<FolderSection
				tabTitle="Experience"
				tabPosition="center"
				bgClass="bg-[#0e0e10]"
				fillClass="fill-[#0e0e10]"
				stickyClass="h-[calc(100svh-120px)] sticky top-[120px]"
				scrollYProgress={effectiveProgress}
				parallaxOffset={-60}
				scrollOffset={-120}
				fadeRange={[0.4, 1]}
				bgBase="#0e0e10"
				bgFaded="#0f1117"
			>
				<ExperienceSection />
			</FolderSection>

			<FolderSection
				tabTitle="Projects"
				tabPosition="right"
				bgClass="bg-zinc-950"
				fillClass="fill-zinc-950"
				stickyClass="min-h-[calc(100svh-160px)] z-30 relative"
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