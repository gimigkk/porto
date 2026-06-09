import { getAllProjects } from "@/lib/projects";
import StackedSections from "@/components/layout/StackedSections";
import ClientProjectModal from "@/components/projects/ClientProjectModal";
import AsciiClouds from "@/components/AsciiClouds/AsciiClouds";
import HeroContent from "@/components/home/HeroContent";

// IMPORT: Loading Cormorant Garamond for the stylish accent
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['600'],
  display: 'swap',
});

export default function Home() {
  const projects = getAllProjects();

  return (
    <main className="w-full min-h-screen bg-[#CBE5FF]">
      <div className="relative w-full">
        {/* Section 1 */}
        <section
          id="home"
          className="h-[95vh] w-full flex flex-col items-center justify-center text-zinc-900 sticky z-10 overflow-hidden"
          style={{ top: "calc(136px - 95vh)" }}
        >
          {/* Sky blue gradient bg */}
          <div className="absolute inset-0 bg-linear-to-b from-[#0c3888] to-[#50aaff]" />

          {/* ASCII Clouds */}
          <div className="absolute inset-0 pointer-events-none select-none z-10">
            <AsciiClouds className="w-full h-full" />
          </div>

          {/* dark gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#00000081] to-transparent z-0" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-[#000000b2] to-transparent z-11" />

          {/* PROGRESSIVE BLUR STACK (2 Layers) */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none select-none z-15 overflow-hidden">
            {/* Layer 1 */}
            <div 
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 75%)',
                maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 75%)',
              }}
            />

            {/* Layer 2 */}
            <div 
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)',
                maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)',
              }}
            />
          </div>

          {/* Content */}
          <HeroContent />
          {/* pamer note */}
          <div className="absolute bottom-6 left-0 right-0 z-20 select-none pointer-events-none">
            <div className="max-w-7xl mx-auto px-6 md:px-8 text-right">
              <p className="text-white/80 text-lg md:text-xs tracking-wider font-mono font-medium ">
                It's a real{" "}
                <span className={`${cormorant.className} italic text-white text-lg md:text-xl font-black px-1 tracking-tight`}>
                  cloud sim ASCII
                </span>{" "}
                btw
              </p>
            </div>
          </div>
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