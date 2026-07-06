export function GithubTooltipContent({ text }: { text: string }) {
  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-300/80 dark:border-neutral-600/80 rounded-xl rounded-tl-sm p-3 shadow-2xl shadow-black/10 dark:shadow-black/40 min-w-max">
      <p className="text-xs font-bold text-neutral-900 dark:text-white whitespace-nowrap">
        {text}
      </p>
    </div>
  );
}
