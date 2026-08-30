"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import type { ProjectMeta } from "@/lib/projects";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import TechIcon from "@/components/shared/TechIcon";
import JumpingDots from "@/components/shared/JumpingDots";
import styles from "@/app/(home)/_components/SkipIntroButton.module.css";

function useIsModalOpen() {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const check = () => setIsOpen(window.location.hash.startsWith("#project="));
    check();
    window.addEventListener("popstate", check);
    window.addEventListener("project-modal-changed", check);
    return () => {
      window.removeEventListener("popstate", check);
      window.removeEventListener("project-modal-changed", check);
    };
  }, []);
  return isOpen;
}

function CulledVideo({ src, className }: { src: string, className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(containerRef, { margin: "200px" });
  const isModalOpen = useIsModalOpen();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  const posterSrc = src.replace('-sm', '').replace(/\.(mp4|webm)$/, '-poster.jpg');

  // Aggressive culling: reset state when out of view
  useEffect(() => {
    if (!isInView) {
      setIsLoaded(false);
      setShowPoster(true);
    }
  }, [isInView]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isModalOpen) {
      videoRef.current.pause();
    } else if (isInView) {
      videoRef.current.play().catch(() => {});
    }
  }, [isModalOpen, isInView]);

  return (
    <div ref={containerRef} className={`${className} bg-zinc-800/50 relative overflow-hidden`} style={{ contentVisibility: "auto" }}>
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-out pointer-events-none z-10 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <img
          src={posterSrc}
          alt=""
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <JumpingDots />
        </div>
      </div>
      {isInView && (
        <video
          ref={videoRef}
          src={src}
          autoPlay={!isModalOpen}
          loop
          muted
          playsInline
          onLoadedData={() => setIsLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
    </div>
  );
}

/* -- Max cards shown in the folder highlight -------------------- */
const MAX_FEATURED = 6;

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95, filter: "blur(10px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

const cardStyle = { perspective: "1000px" };

export default function ProjectCards({
  projects,
}: {
  projects: ProjectMeta[];
}) {
  const featured = projects.slice(0, MAX_FEATURED);
  const hasMore = projects.length >= MAX_FEATURED;

  const [isAnimationSettled, setIsAnimationSettled] = useState(false);
  const wc = isAnimationSettled ? "auto" : "transform, opacity, filter";

  return (
    <div className="relative w-full max-w-350 mx-auto pb-20">
      {/* -- Cards Grid (3-column) ---------------- */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        onAnimationComplete={() => setIsAnimationSettled(true)}
        viewport={{ once: true, margin: "-50px" }}
        variants={gridVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-3 px-3 md:px-12"
      >
        {featured.map((project) => (
          <motion.article
            variants={cardVariants}
            key={project.slug}
            className="group relative w-full h-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] md:hover:z-50"
            style={{ ...cardStyle, willChange: wc as any }}
          >
            {/* Background Documents (Pop-up effect) — hidden on mobile */}
            <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
              <div className="absolute top-10 left-[12%] right-[12%] bottom-16 rounded-lg border border-zinc-700/50 bg-zinc-800 shadow-xl transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-24 group-hover:-rotate-3 origin-bottom">
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-1.5 w-1/3 bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-full bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-2/3 bg-zinc-600 rounded-full"></div>
                  <div className="h-1.5 w-4/5 bg-zinc-600 rounded-full"></div>
                </div>
              </div>
              <div
                className="absolute top-8 left-[8%] right-[8%] bottom-12 rounded-lg border border-black/20 shadow-xl transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-12 group-hover:rotate-3 origin-bottom delay-75"
                style={{ backgroundColor: project.accent }}
              >
                <div className="p-5 flex flex-col gap-3 mix-blend-overlay opacity-80">
                  <div className="h-1.5 w-1/4 bg-white rounded-full"></div>
                  <div className="h-1.5 w-4/5 bg-white rounded-full"></div>
                  <div className="h-1.5 w-1/2 bg-white rounded-full"></div>
                  <div className="h-1.5 w-full bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <a
              href={`#project=${project.slug}`}
              aria-label={`View details for ${project.title}`}
              onMouseEnter={() => {
                import(`@/content/projects/${project.slug}.mdx`).catch(() => {});
              }}
              onClick={(e) => {
                e.preventDefault();
                const url = window.location.pathname + "#project=" + project.slug;
                window.history.pushState(null, "", url);
                window.dispatchEvent(new Event("project-modal-changed"));
              }}
              className="relative z-10 flex w-full flex-col overflow-hidden md:overflow-visible no-underline cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom md:group-hover:transform-[translateY(13px)_rotateX(-6deg)] md:group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]"
              style={{ willChange: isAnimationSettled ? "auto" : "transform" }}
            >
              {/* -- Thumbnail -- */}
              <div className="relative z-10 box-border aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                {(project.thumbnail.endsWith('.mp4') || project.thumbnail.endsWith('.webm')) ? (
                  <CulledVideo
                    src={project.thumbnail.replace(/\.(mp4|webm)$/i, '-sm.$1')}
                    className="w-full h-full"
                  />
                ) : (
                  <Image
                    src={project.thumbnail}
                    alt={`${project.title} preview`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>

              {/* -- Metadata plate -- */}
              <div className="relative z-10 box-border flex w-full items-end justify-between gap-3 px-1 pt-2 pb-1 md:z-0 md:-mt-2 md:gap-4 md:rounded-b-lg md:bg-white md:px-4 md:pt-4 md:pb-2.5 md:text-zinc-950 md:shadow-[0_10px_20px_-14px_rgba(0,0,0,0.8)]">
                {/* Left side: Title & Description */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3
                      className="text-sm font-bold text-white md:text-base md:text-zinc-950 truncate min-w-0 transition-colors duration-300"
                    >
                      {project.title}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 md:font-semibold md:text-zinc-600 leading-snug truncate">
                    {project.description}
                  </p>
                </div>

                {/* Right side: Tech & Actions */}
                <div className="flex items-center gap-2 shrink-0 md:items-end">
                  {/* Tech stack — Mobile (limited) */}
                  <div className="md:hidden flex items-center gap-1.5 overflow-hidden">
                    {project.stack.slice(0, 3).map((tech) => (
                      <TechIcon
                        key={tech}
                        tech={tech}
                        size={13}
                        className="text-zinc-500"
                      />
                    ))}
                  </div>

                  {/* Tech stack — Desktop */}
                  <div className="hidden md:flex flex-wrap-reverse items-end justify-end gap-2 shrink-0 w-[36px] leading-none">
                    {project.stack.slice(0, 4).map((tech) => (
                      <TechIcon
                        key={tech}
                        tech={tech}
                        size={14}
                        className="text-zinc-700 hover:text-zinc-950 transition-colors"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </a>
          </motion.article>
        ))}
      </motion.div>

      {hasMore && (
        <div className="absolute bottom-0 left-0 right-0 h-52 pointer-events-none flex flex-col justify-end items-center pb-8 z-50">
          <div className="md:hidden absolute inset-x-0 top-0 bottom-20 bg-linear-to-t from-[#09090b]/80 via-[#09090b]/30 to-transparent" />
          <div className="md:hidden absolute inset-x-0 bottom-0 h-20 bg-[#09090b]/80" />
          {/* Mobile View More CTA */}
          <Link
            href="/projects"
            className={`md:hidden ${styles.pushable} group shrink-0 pointer-events-auto relative z-10`}
            aria-label="View Project Archive"
          >
            <span className={styles.shadow}></span>
            <span className={styles.edge}></span>
            <span
              className={`${styles.front} !flex items-center justify-center gap-1.5 whitespace-nowrap`}
              style={{
                padding: "6px 12px",
                fontSize: "0.75rem"
              }}
            >
              <span>View More</span>
              <ArrowRight className="w-3 h-3 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
