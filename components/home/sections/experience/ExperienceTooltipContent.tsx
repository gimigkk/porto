import { ExperienceItem } from "@/types/experience";

export function ExperienceTooltipContent({ item }: { item: ExperienceItem }) {
  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-300/80 dark:border-neutral-600/80 rounded-xl rounded-tl-sm p-4 shadow-2xl shadow-black/10 dark:shadow-black/40 max-w-xs flex flex-col gap-3">
      {item.image && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden shrink-0">
          <img src={item.image} alt={item.company} className="object-cover w-full h-full" />
        </div>
      )}
      
      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
        {item.description}
      </p>
      
      <div className="mt-auto">
        <p className="text-xs text-neutral-500 dark:text-neutral-500 italic">
          Impact score: {item.impressiveness}/10
        </p>
      </div>
    </div>
  );
}
