import { ExternalLink } from "lucide-react";

export function CampusTooltipContent() {
  return (
    <div className="max-w-xs flex flex-col gap-3 p-4">
      <div className="relative w-full h-32 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
        <img 
          src="/ipb-drone.jpg" 
          alt="IPB University Campus" 
          className="object-cover w-full h-full"
        />
      </div>
      
      <div>
        <h4 className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
          IPB University
          <ExternalLink className="w-3 h-3 text-neutral-500" />
        </h4>
        <p className="text-xs text-neutral-800 leading-relaxed line-clamp-4">
          IPB University, formerly known as Bogor Agricultural University, is a state-run university located in Bogor, West Java, Indonesia. Originally the Faculty of Agriculture at the University of Indonesia, it officially became an independent agricultural institute in 1963. It is widely recognized for its expertise in tropical agriculture, life sciences, and food security.
        </p>
      </div>
    </div>
  );
}
