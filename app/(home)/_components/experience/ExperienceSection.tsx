"use client";

import { useState, useRef, useCallback } from "react";
import experienceData from "@/lib/data/experience.json";
import { ExperienceItem } from "@/types/experience";
import { ExperienceDetail } from "./ExperienceDetail";
import { ClothingRack } from "./ClothingRack";

const typedExperienceData = experienceData as ExperienceItem[];

export default function ExperienceSection() {
  const containerRef = useRef<HTMLElement>(null);
  // Default to the latest experience (last item in array)
  const [selectedIndex, setSelectedIndex] = useState<number>(
    typedExperienceData.length > 0 ? typedExperienceData.length - 1 : 0
  );

  const selectedItem = typedExperienceData[selectedIndex] || typedExperienceData[0];

  const handleSelect = useCallback((_: ExperienceItem, index: number) => {
    setSelectedIndex(index);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full flex flex-col items-start md:justify-center md:mt-6 overflow-visible"
    >
      <div className="relative mx-auto w-full max-w-[1400px] px-4 md:px-8 lg:px-12 overflow-visible">
        {/* Main Interactive Stage with 2:3 Column Ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-12 items-start w-full overflow-visible">
          {/* Column 1 (2 parts): Simple Image & Paragraph */}
          <div className="lg:col-span-2 w-full overflow-visible">
            <ExperienceDetail item={selectedItem} />
          </div>

          {/* Column 2 (3 parts): Straight Clothing Rack (No containing border) */}
          <div className="lg:col-span-3 w-full flex flex-col items-center overflow-visible">
            <ClothingRack
              items={typedExperienceData}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
