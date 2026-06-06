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
          className="h-[95vh] w-full flex flex-col items-center justify-center text-zinc-900 sticky z-10 overflow-hidden"
          style={{ top: "calc(5rem - 90vh)" }}
        >
          {/* Sky blue gradient bg */}
          <div className="absolute inset-0 bg-linear-to-b from-[#103f97] to-[#50aaff]" />

          {/* ASCII Clouds — tune CONFIG inside AsciiClouds.tsx */}
          <div className="absolute inset-0 pointer-events-none select-none z-10">
            <AsciiClouds className="w-full h-full" />
          </div>

          {/* dark gradient from bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#00000081] to-transparent z-0" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* <h1 className="text-6xl font-extrabold tracking-tight mb-6">Welcome</h1>
            <p className="text-2xl opacity-60 max-w-2xl text-center">
              Scroll down to explore.
            </p> */}
          </div>
          {/* <div className="absolute bottom-10 animate-bounce z-10">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div> */}
        </section>

        {/* Sections 2, 3, 4 (Stacked Folders) */}
        <StackedSections projects={projects} />
      </div>

      {/* Section 5 */}
      <section className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white relative z-30">
        <h2 className="text-5xl font-bold mb-6 text-amber-500">Section 5</h2>
        <div className="text-xl opacity-80 max-w-xl text-center">
          CTA Kerja Sama
        </div>
      </section>

      <ClientProjectModal projects={projects} />
    </main>
  );
}