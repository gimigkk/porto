import { getAllProjects } from "@/lib/projects";
import { getGithubGraph } from "@/lib/github";
import HomeClient from "@/components/home/HomeClient";

export default async function Home() {
  const projects = getAllProjects();
  const githubGraph = await getGithubGraph();

  const projectItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": projects.map((project, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": project.title,
        "description": project.description,
        "applicationCategory": "DeveloperApplication",
        "url": `https://www.gimiaw.web.id/?project=${project.slug}`
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectItemList) }}
      />
      <HomeClient projects={projects} githubGraph={githubGraph} />
    </>
  );
}