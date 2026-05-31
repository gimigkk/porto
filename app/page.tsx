import StackedSections from "@/components/StackedSections";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-white">
      <div className="relative w-full">
        {/* Section 1 */}
        <section
          className="h-[90vh] w-full flex flex-col items-center justify-center bg-white text-zinc-900 sticky z-10"
          style={{ top: "calc(5rem - 90vh)" }}
        >
          <h1 className="text-6xl font-extrabold tracking-tight mb-6">Welcome</h1>
          <p className="text-2xl opacity-60 max-w-2xl text-center">
            Scroll down to explore.
          </p>
          <div className="absolute bottom-10 animate-bounce">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Sections 2, 3, 4 (Stacked Folders) */}
        <StackedSections />
      </div>

      {/* Section 5 */}
      <section className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white relative z-30">
        <h2 className="text-5xl font-bold mb-6 text-amber-500">Section 5</h2>
        <div className="text-xl opacity-80 max-w-xl text-center">
          You have reached the final section. This section scrolls in normally over the stacked sections.
        </div>
      </section>
    </main>
  );
}
