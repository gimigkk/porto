import { getAllProjects } from "@/lib/projects";
import StackedSections from "@/components/layout/StackedSections";
import ClientProjectModal from "@/components/projects/ClientProjectModal";
import AsciiClouds from "@/components/AsciiClouds";

export default function Home() {
  const projects = getAllProjects();

  return (
    <main className="w-full min-h-screen bg-[#CBE5FF]">
      <div className="relative w-full">
        {/* Section 1 */}
        <section
          id="home"
          className="h-[90vh] w-full flex flex-col items-center justify-center text-zinc-900 sticky z-10 overflow-hidden"
          style={{ top: "calc(5rem - 90vh)" }}
        >
          {/* Sky blue gradient bg */}
          <div className="absolute inset-0 bg-linear-to-b from-[#77b7ff] to-[#deefff]" />

          {/* ASCII Clouds — tune CONFIG inside AsciiClouds.tsx */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <AsciiClouds className="w-full h-full" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* <h1 className="text-6xl font-extrabold tracking-tight mb-6">Welcome</h1>
            <p className="text-2xl opacity-60 max-w-2xl text-center">
              Scroll down to explore.
            </p> */}
          </div>
          <div className="absolute bottom-10 animate-bounce z-10">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Sections 2, 3, 4 (Stacked Folders) */}
        <StackedSections projects={projects} />
      </div>

      {/* Section 5 */}
      <section className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white relative z-30">
        <h2 className="text-5xl font-bold mb-6 text-amber-500">Section 5</h2>
        <div className="text-xl opacity-80 max-w-xl text-center">
          You have reached the final section. This section scrolls in normally over the stacked sections.
        </div>
      </section>

      <ClientProjectModal projects={projects} />
    </main>
  );
}