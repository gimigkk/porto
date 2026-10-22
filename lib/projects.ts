import fs from "fs";
import path from "path";

/**
 * Project metadata registry — now dynamically reads from content/projects/*.mdx
 * Each entry here corresponds to a matching MDX file that provides the full article content.
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
  github?: string;
  links?: {
    url: string;
    label: string;
    icon: string;
  }[];
  weight?: number;
}

/**
 * Get all projects by reading the .mdx files in content/projects,
 * sorted by year descending then alphabetically.
 * 
 * Note: This function uses `fs` and must only be called in Server Components.
 */
function extractMetadataBlock(content: string): string | null {
  const match = /export\s+const\s+metadata\s*=\s*/.exec(content);
  if (!match) return null;

  const startIndex = match.index + match[0].length;
  if (content[startIndex] !== "{") return null;

  let depth = 0;
  let inString: string | null = null;
  let isEscaped = false;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return content.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

export function getAllProjects(): ProjectMeta[] {
  const projectsDir = path.join(process.cwd(), "content", "projects");
  
  let filenames: string[] = [];
  try {
    filenames = fs.readdirSync(projectsDir);
  } catch (err) {
    console.error("Failed to read projects directory", err);
    return [];
  }

  const projects: ProjectMeta[] = [];

  for (const filename of filenames) {
    if (!filename.endsWith(".mdx")) continue;

    const filePath = path.join(projectsDir, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const metadataString = extractMetadataBlock(fileContents);

    if (metadataString) {
      try {
        const metadata = new Function(`return (${metadataString})`)() as ProjectMeta;
        if (!metadata.slug) {
          metadata.slug = filename.replace(/\.mdx$/, "");
        }
        projects.push(metadata);
      } catch (e) {
        console.error(`Failed to parse metadata in ${filename}`, e);
      }
    }
  }

  return projects.sort((a, b) => {
    const weightA = a.weight ?? 999;
    const weightB = b.weight ?? 999;
    if (weightA !== weightB) return weightA - weightB;
    if (a.year !== b.year) return b.year.localeCompare(a.year);
    return a.title.localeCompare(b.title);
  });
}

/**
 * Get all project slugs (for generateStaticParams).
 */
export function getProjectSlugs(): string[] {
  return getAllProjects().map((p) => p.slug);
}
