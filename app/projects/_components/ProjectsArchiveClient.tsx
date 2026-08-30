"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useInView, type Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ProjectMeta } from "@/lib/projects";
import TechIcon from "@/components/shared/TechIcon";
import JumpingDots from "@/components/shared/JumpingDots";
import ClientProjectModal from "@/app/(home)/_components/projects/ClientProjectModal";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import Footer from "@/components/layout/Footer";
import styles from "@/app/(home)/_components/SkipIntroButton.module.css";

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 45, scale: 0.96, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

function ArchiveCardVideo({ src, poster }: { src: string; poster: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(containerRef, { margin: "200px" });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isInView) {
      setIsLoaded(false);
    }
  }, [isInView]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isInView) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-zinc-900 overflow-hidden rounded-[6px]">
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none z-10 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <JumpingDots />
        </div>
      </div>

      {isInView && (
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

export default function ProjectsArchiveClient({ projects }: { projects: ProjectMeta[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const cat = searchParams?.get("category");
    if (cat) {
      setSelectedCategory(cat);
    } else {
      setSelectedCategory("All");
    }
  }, [searchParams]);

  useEffect(() => {
    const el = document.getElementById("ssr-loading-screen");
    if (el) {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      el.style.display = "none";
    }
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "All") {
      router.replace("/projects", { scroll: false });
    } else {
      router.replace(`/projects?category=${encodeURIComponent(cat)}`, { scroll: false });
    }
  };

  const handleCardClick = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.location.pathname + window.location.search + "#project=" + slug;
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event("project-modal-changed"));
  };

  return (
    <LanguageProvider>
      <main className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between pt-24 md:pt-28">
        <div className="w-full h-full flex flex-col items-center justify-center flex-1">
          {/* Header + Top Bar Row */}
          <div className="w-full max-w-350 mx-auto px-4 md:px-12 mb-6 md:mb-8">
            <div className="text-left mb-6">
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
                Projects Archive
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
                Full index of software engineering systems, interactive web platforms, tools, and digital experiments.
              </p>
            </div>

            {/* Filter Chips on Left + White Pushable Button on Right */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
              {/* Filter Chips Bar */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* White 3D Pushable Button */}
              <Link
                href="/"
                className={`${styles.pushable} group shrink-0`}
                aria-label="Back to Home"
              >
                <span className={styles.shadow}></span>
                <span className={styles.edge}></span>
                <span
                  className={`${styles.front} !flex items-center justify-center gap-1.5 whitespace-nowrap`}
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-1" />
                  <span>Back to Home</span>
                </span>
              </Link>
            </div>
          </div>

          {/* 2-Column Grid with Homepage-style Entry Float-Up Animation */}
          <div className="relative w-full max-w-350 mx-auto pb-24">
            <motion.div
              key={selectedCategory}
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-4 md:px-12"
            >
            {filteredProjects.map((project) => {
              const isVideo = project.thumbnail.endsWith(".mp4") || project.thumbnail.endsWith(".webm");
              const cardVideoSrc = isVideo
                ? project.thumbnail.replace(/\.(mp4|webm)$/i, "-sm.$1")
                : project.thumbnail;
              const posterSrc = isVideo
                ? project.thumbnail.replace(/\.(mp4|webm)$/i, "-poster.jpg")
                : project.thumbnail;

              return (
                <motion.article
                  key={project.slug}
                  variants={cardVariants}
                  className="group flex flex-col w-full"
                >
                  {/* Big Thumbnail Container */}
                  <a
                    href={`#project=${project.slug}`}
                    onClick={(e) => handleCardClick(project.slug, e)}
                    onMouseEnter={() => {
                      import(`@/content/projects/${project.slug}.mdx`).catch(() => {});
                    }}
                    className="relative aspect-video w-full overflow-hidden rounded-[6px] bg-zinc-900 border border-zinc-800/80 group-hover:border-zinc-700 transition-colors cursor-pointer block"
                    aria-label={`View details for ${project.title}`}
                  >
                    {isVideo ? (
                      <ArchiveCardVideo src={cardVideoSrc} poster={posterSrc} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Top-Right Badges Overlay */}
                    <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none flex items-center gap-1.5">
                      <span className="text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-wider text-white/90 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10 shadow-md">
                        {project.category}
                      </span>
                      {project.year && (
                        <span className="text-[10px] md:text-[11px] font-mono font-medium text-zinc-300 bg-black/75 backdrop-blur-md px-2 py-1 rounded-[4px] border border-white/10 shadow-md">
                          {project.year}
                        </span>
                      )}
                    </div>
                  </a>

                  {/* Metadata below thumbnail */}
                  <div className="flex flex-col mt-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
                        <a
                          href={`#project=${project.slug}`}
                          onClick={(e) => handleCardClick(project.slug, e)}
                          className="hover:underline cursor-pointer"
                        >
                          {project.title}
                        </a>
                      </h2>

                      {/* Tech icons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {project.stack.slice(0, 5).map((tech) => (
                          <TechIcon
                            key={tech}
                            tech={tech}
                            size={14}
                            className="text-zinc-400 hover:text-zinc-200 transition-colors"
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-zinc-400 font-normal leading-relaxed mt-1.5 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
          </div>
        </div>

        {/* Global Client Project Modal */}
        <ClientProjectModal projects={projects} />
        <Footer />
      </main>
    </LanguageProvider>
  );
}
