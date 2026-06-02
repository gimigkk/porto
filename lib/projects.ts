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
}

/**
 * Get all projects by reading the .mdx files in content/projects,
 * sorted by year descending then alphabetically.
 * 
 * Note: This function uses `fs` and must only be called in Server Components.
 */
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

    // Extract the export const metadata = { ... } block
    const match = fileContents.match(/export\s+const\s+metadata\s*=\s*({[\s\S]*?});/);
    if (match) {
      try {
        // Safely evaluate the JS object literal using a Function
        // We use new Function here because it's a build-time script running in Node,
        // parsing our own trusted code, and it effortlessly handles single/double quotes, 
        // trailing commas, and unquoted keys.
        const metadata = new Function(`return ${match[1]}`)() as ProjectMeta;
        
        // Use the filename as fallback slug if not provided
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
