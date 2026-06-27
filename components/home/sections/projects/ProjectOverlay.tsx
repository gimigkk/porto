import { getAllProjects } from "@/lib/projects";
import ProjectModal from "@/components/home/sections/projects/ProjectModal";
import { notFound } from "next/navigation";

export default async function ProjectOverlay({ slug }: { slug: string }) {
  const project = getAllProjects().find((p) => p.slug === slug);
  if (!project) return notFound();

  const { default: Post } = await import(`@/content/projects/${slug}.mdx`);

  return (
    <ProjectModal>
      <article className="min-h-full bg-zinc-900 text-zinc-200 flex flex-col">
        {/* Header: Text Left, Video Right */}
        <header className="w-full max-w-5xl mx-auto px-6 pt-12 sm:pt-16 pb-10 border-b border-zinc-800/50">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Left: Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{project.category}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="text-[11px] font-mono text-zinc-400">{project.year}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-zinc-100 tracking-tight">
                {project.title}
              </h1>

              <p className="text-base text-zinc-400 leading-relaxed mb-6">
                {project.description}
              </p>

              <div>
                <h3 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map(tech => (
                     <span key={tech} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5 transition-colors hover:bg-zinc-700">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={`https://skillicons.dev/icons?i=${tech}&theme=dark`} alt={tech} className="w-3.5 h-3.5 rounded-[2px]" />
                       {tech}
                     </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Video */}
            <div className="w-full md:w-80 lg:w-96 shrink-0">
              <div className="w-full aspect-video bg-zinc-800 rounded-xl border border-zinc-700 flex items-center justify-center overflow-hidden relative group">
                <div className="w-12 h-12 rounded-full bg-zinc-700/80 border border-zinc-600 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all cursor-pointer">
                   <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M8 5v14l11-7z" />
                   </svg>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Article body */}
        <div className="flex-1 w-full px-6 py-10 sm:py-12 pb-32 prose prose-invert prose-zinc max-w-5xl mx-auto prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-strong:text-zinc-200 prose-li:text-zinc-400 prose-a:text-amber-400 hover:prose-a:text-amber-300">
          <Post />
        </div>
      </article>
    </ProjectModal>
  );
}
