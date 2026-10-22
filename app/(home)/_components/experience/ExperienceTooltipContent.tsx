import Image from "next/image";
import { ExperienceItem } from "@/types/experience";

export function ExperienceTooltipContent({ item }: { item: ExperienceItem }) {
  return (
    <div className="max-w-xs flex flex-col gap-3 p-4">
      {item.image && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden shrink-0">
          <Image src={item.image} alt={item.company} fill sizes="320px" className="object-cover" />
        </div>
      )}
      
      <p className="text-sm text-neutral-800 leading-relaxed">
        {item.description}
      </p>
      
      <div className="mt-auto">
        <p className="text-xs text-neutral-500 italic">
          Impact score: {item.impressiveness}/10
        </p>
      </div>
    </div>
  );
}
