import { getAllProjects } from "@/lib/projects";
import { getGithubGraph } from "@/lib/github";
import HomeClient from "@/components/home/HomeClient";

export default async function Home() {
  const projects = getAllProjects();
  const githubGraph = await getGithubGraph();

  return <HomeClient projects={projects} githubGraph={githubGraph} />;
}