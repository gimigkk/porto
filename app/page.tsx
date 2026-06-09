import { getAllProjects } from "@/lib/projects";
import HomeClient from "@/components/home/HomeClient";

export default function Home() {
  const projects = getAllProjects();

  return <HomeClient projects={projects} />;
}