interface ModalMetaStripProps {
  category: string;
  year?: string | number;
  stack: string[];
}

export default function ModalMetaStrip({
  category,
  year,
  stack,
}: ModalMetaStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 px-5 my-8 rounded-md bg-zinc-900/40 border border-zinc-800/80">
      <div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
          Domain
        </div>
        <div className="text-xs sm:text-sm font-semibold text-zinc-200">
          {category}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
          Timeline
        </div>
        <div className="text-xs sm:text-sm font-mono text-zinc-300">
          {year}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
          Core Tech
        </div>
        <div className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
          {stack.slice(0, 3).join(", ")}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
          Status
        </div>
        <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Completed
        </div>
      </div>
    </div>
  );
}
