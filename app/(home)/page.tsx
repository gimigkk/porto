import { getAllProjects } from "@/lib/projects";
import { getGithubGraph } from "@/lib/github";
import HomeClient from "@/app/(home)/_components/HomeClient";
import experienceData from "@/lib/data/experience.json";

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

  const experienceItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Work Experience & Career Timeline",
    description: "Professional work experience and engineering roles of Gilang Muhamad Widiagung",
    numberOfItems: experienceData.length,
    itemListElement: experienceData.map((exp, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Role",
        roleName: exp.role,
        description: exp.description,
        startDate: exp.startDate,
        endDate: exp.endDate,
        worksFor: {
          "@type": "Organization",
          name: exp.company,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(experienceItemList) }}
      />
      <HomeClient projects={projects} githubGraph={githubGraph} />
    </>
  );
}