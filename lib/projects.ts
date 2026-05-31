/**
 * Project metadata registry — the single source of truth for project cards.
 * Each entry here corresponds to a matching MDX file at content/projects/[slug].mdx
 * that provides the full article content.
 *
 * When adding a new project:
 * 1. Add an entry here
 * 2. Create the matching .mdx file in content/projects/
 * 3. Add a thumbnail image in public/projects/[slug]/
 */

export interface ProjectMeta {
  title: string;
  slug: string;
  description: string;
  stack: string[];
  year: string;
  category: string;
  accent: string;
  thumbnail: string;
}

const projects: ProjectMeta[] = [
  {
    title: "KRSwitch",
    slug: "krswitch",
    description:
      "A smart scheduling platform that auto-matches university students looking to swap class sections — real-time, hassle-free.",
    stack: ["nextjs", "ts", "prisma", "postgres"],
    year: "2026",
    category: "Full-Stack Platform",
    accent: "#f59e0b",
    thumbnail: "/projects/krswitch/thumbnail.png",
  },
  {
    title: "Porto",
    slug: "porto",
    description:
      "A premium developer portfolio with scroll-driven folder animations and buttery micro-interactions — you're looking at it.",
    stack: ["nextjs", "tailwind", "css"],
    year: "2026",
    category: "Creative & Design",
    accent: "#a78bfa",
    thumbnail: "/projects/porto/thumbnail.png",
  },
  {
    title: "BudgetFlow",
    slug: "budgetflow",
    description:
      "Personal finance companion with visual spend analytics, smart alerts, and goal tracking — making budgeting feel effortless.",
    stack: ["react", "nodejs", "firebase"],
    year: "2025",
    category: "Web Application",
    accent: "#34d399",
    thumbnail: "/projects/budgetflow/thumbnail.png",
  },
  {
    title: "Dummy Project",
    slug: "dummy",
    description:
      "A temporary dummy project to test the 3x2 grid layout and ensure it fits nicely without cropping vertically.",
    stack: ["nextjs", "tailwind", "ts"],
    year: "2024",
    category: "Test Case",
    accent: "#ef4444",
    thumbnail: "/projects/porto/thumbnail.png",
  },
];

/**
 * Get all projects, sorted by year descending then alphabetically.
 */
export function getAllProjects(): ProjectMeta[] {
  return [...projects].sort((a, b) => {
    if (a.year !== b.year) return b.year.localeCompare(a.year);
    return a.title.localeCompare(b.title);
  });
}

/**
 * Get all project slugs (for generateStaticParams).
 */
export function getProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}
