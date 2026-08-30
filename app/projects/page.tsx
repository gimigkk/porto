import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProjects } from "@/lib/projects";
import ProjectsArchiveClient from "@/app/projects/_components/ProjectsArchiveClient";

export const metadata: Metadata = {
  title: "Project Archive | All Projects",
  description:
    "Complete portfolio archive of software projects, full-stack platforms, tools, games, and web applications built by Gilang Muhamad Widiagung (@gimigkk).",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Project Archive | Gilang Muhamad Widiagung",
    description:
      "Explore the full collection of software engineering projects, automated tools, and digital experiences by Gilang Muhamad Widiagung.",
    url: "https://www.gimiaw.web.id/projects",
    type: "website",
  },
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  const projectItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: project.title,
        description: project.description,
        applicationCategory: "DeveloperApplication",
        url: `https://www.gimiaw.web.id/projects#project=${project.slug}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectItemList) }}
      />
      <Suspense fallback={null}>
        <ProjectsArchiveClient projects={projects} />
      </Suspense>
    </>
  );
}
