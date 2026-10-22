export default function ArticleSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse py-4">
      {/* Title placeholder */}
      <div className="h-8 bg-zinc-800/60 rounded-md w-3/4 mb-2"></div>

      {/* Paragraph blocks */}
      <div className="space-y-3">
        <div className="h-4 bg-zinc-800/40 rounded w-full"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[95%]"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[88%]"></div>
      </div>

      {/* Subheader placeholder */}
      <div className="h-6 bg-zinc-800/50 rounded-md w-1/3 my-2"></div>

      {/* Paragraph block 2 */}
      <div className="space-y-3">
        <div className="h-4 bg-zinc-800/40 rounded w-[92%]"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-full"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[85%]"></div>
        <div className="h-4 bg-zinc-800/40 rounded w-[60%]"></div>
      </div>

      {/* Code block placeholder */}
      <div className="h-56 bg-zinc-800/20 rounded-xl w-full my-2 border border-zinc-800/40"></div>
    </div>
  );
}
