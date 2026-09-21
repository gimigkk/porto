import { getAllProjects } from "@/lib/projects";
import { getGithubGraph } from "@/lib/github";
import HomeClient from "@/app/(home)/_components/HomeClient";

export default async function Home() {
  const projects = getAllProjects();
  const githubGraph = await getGithubGraph();

  const projectItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured Projects & Portfolio",
    description: "Featured software engineering and product design projects by Gilang Muhamad Widiagung",
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: project.title,
        description: project.description,
        applicationCategory: project.category || "DeveloperApplication",
        operatingSystem: "Web",
        image: project.thumbnail.startsWith("http")
          ? project.thumbnail
          : `https://www.gimiaw.web.id${project.thumbnail}`,
        url: `https://www.gimiaw.web.id/#project=${project.slug}`,
        author: {
          "@type": "Person",
          name: "Gilang Muhamad Widiagung",
          url: "https://www.gimiaw.web.id",
        },
      },
    })),
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