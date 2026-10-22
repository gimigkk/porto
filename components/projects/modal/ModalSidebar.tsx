import TechIcon from "@/components/ui/TechIcon";
import LangToggle from "@/components/ui/LangToggle";
import ReadingProgressBar from "./ReadingProgressBar";
import TableOfContents from "./TableOfContents";

interface ModalSidebarProps {
  category: string;
  year?: string | number;
  accent: string;
  slug: string;
  stack: string[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  hasPost: boolean;
}

export default function ModalSidebar({
  category,
  year,
  accent,
  slug,
  stack,
  scrollRef,
  hasPost,
}: ModalSidebarProps) {
  return (
    <aside
      className="w-full lg:w-72 xl:w-80 h-auto lg:h-full shrink-0 bg-zinc-950 overflow-y-auto no-scrollbar mr-12"
      data-lenis-prevent="true"
    >
      <div
        className="p-6 sm:p-8 pt-12 sm:pt-16 flex flex-col gap-4 pb-12 animate-slide-up-fade"
        style={{ opacity: 0 }}
      >
        <LangToggle />

        {/* Reading Progress Indicator */}
        <ReadingProgressBar scrollRef={scrollRef} accent={accent} />

        {/* Metadata Section */}
        <div className="flex flex-col gap-4 p-4 rounded-md bg-zinc-900/40 border border-zinc-800/80">
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">
              Category
            </h3>
            <p className="text-xs font-semibold text-zinc-200">{category}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">
              Year
            </h3>
            <p className="text-xs font-mono text-zinc-400">{year}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              Technologies
            </h3>
            <div className="flex flex-wrap items-center gap-2.5">
              {stack.map((tech: string) => (
                <div
                  key={tech}
                  className="group relative flex items-center justify-center cursor-default"
                >
                  <TechIcon
                    tech={tech}
                    size={17}
                    className="text-zinc-400 group-hover:text-white transition-colors"
                  />
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded-sm shadow-xl whitespace-nowrap z-50">
                    {tech}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        {hasPost && (
          <TableOfContents accent={accent} slug={slug} scrollRef={scrollRef} />
        )}
      </div>
    </aside>
  );
}
