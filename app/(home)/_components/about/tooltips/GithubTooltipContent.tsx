export function GithubTooltipContent({ text }: { text: string }) {
  return (
    <div className="min-w-max p-3">
      <p className="text-xs font-bold text-neutral-900 dark:text-white whitespace-nowrap">
        {text}
      </p>
    </div>
  );
}
