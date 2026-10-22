"use client";

import { useRef, useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useInView, type Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ProjectMeta } from "@/lib/projects";
import TechIcon from "@/components/ui/TechIcon";
import JumpingDots from "@/components/ui/JumpingDots";
import ClientProjectModal from "@/components/projects/ClientProjectModal";
import Footer from "@/components/layout/Footer";
import PushButton from "@/components/ui/PushButton";
import Badge from "@/components/ui/Badge";

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

function ArchiveCardVideo({ src, poster, title }: { src: string; poster: string; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(containerRef, { margin: "200px" });
  const [isLoaded, setIsLoaded] = useState(false);

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
          alt={title ? `${title} video preview poster` : "Project video preview poster"}
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

const CHIP_BASE = "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer";
const CHIP_ACTIVE = "bg-white text-zinc-950 shadow-sm";
const CHIP_INACTIVE = "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80";
const CARD_THUMB_CONTAINER = "relative aspect-video w-full overflow-hidden rounded-[6px] bg-zinc-900 border border-zinc-800/80 group-hover:border-zinc-700 transition-colors cursor-pointer block";

function ProjectsArchiveContent({ projects }: { projects: ProjectMeta[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams?.get("category") || "All";

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
    window.dispatchEvent(new Event("hashchange"));
  };

  return (
    <>
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
                      className={`${CHIP_BASE} ${isActive ? CHIP_ACTIVE : CHIP_INACTIVE}`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* White 3D Pushable Button */}
              <PushButton
                href="/"
                ariaLabel="Back to Home"
                className="group shrink-0"
                frontStyle={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                <span>Back to Home</span>
              </PushButton>
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
                    className={CARD_THUMB_CONTAINER}
                    aria-label={`View details for ${project.title}`}
                  >
                    {isVideo ? (
                      <ArchiveCardVideo src={cardVideoSrc} poster={posterSrc} title={project.title} />
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
                      <Badge variant="glass">{project.category}</Badge>
                      {project.year && (
                        <Badge variant="glass-muted">{project.year}</Badge>
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
    </>
  );
}

export default function ProjectsArchiveClient({ projects }: { projects: ProjectMeta[] }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-950" />}>
      <ProjectsArchiveContent projects={projects} />
    </Suspense>
  );
}
