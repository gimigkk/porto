export function GithubTooltipContent({ text }: { text: string }) {
  return (
    <div className="bg-zinc-800/95 backdrop-blur-md text-zinc-100 px-3 py-2 rounded-lg shadow-xl shadow-black/40 border border-zinc-700/80 text-xs font-medium whitespace-nowrap">
      {text}
    </div>
  );
}
