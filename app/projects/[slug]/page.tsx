import { getProjectSlugs, getAllProjects } from "@/lib/projects";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { default: Post } = await import(`@/content/projects/${slug}.mdx`);

  // Get metadata from the registry (not from MDX export, to avoid fs issues)
  const project = getAllProjects().find((p) => p.slug === slug)!;

  return (
    <article className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Header */}
      <header className="max-w-3xl mx-auto pt-24 pb-12 px-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to home
        </a>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            {project.category}
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full border"
            style={{
              color: project.accent,
              borderColor: `${project.accent}33`,
              backgroundColor: `${project.accent}11`,
            }}
          >
            {project.year}
          </span>
        </div>

        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ color: project.accent }}
        >
          {project.title}
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          {project.description}
        </p>

        {/* Tech stack */}
        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://skillicons.dev/icons?i=${project.stack.join(",")}&theme=dark`}
            alt={`Tech stack: ${project.stack.join(", ")}`}
            height={40}
          />
        </div>
      </header>

      {/* Article body */}
      <div className="max-w-3xl mx-auto px-6 pb-24 prose prose-invert prose-zinc prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-strong:text-zinc-200 prose-li:text-zinc-400 prose-a:text-amber-400 hover:prose-a:text-amber-300">
        <Post />
      </div>
    </article>
  );
}

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;
