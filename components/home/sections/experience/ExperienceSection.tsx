"use client";

import { motion } from "framer-motion";
import { ExperienceNode } from "./ExperienceNode";
import experienceData from "@/lib/data/experience.json";

export default function ExperienceSection() {
  return (
    <section className="relative w-full overflow-hidden h-full flex items-center -mt-12 md:-mt-24">
      <div className="relative mx-auto w-full max-w-350 px-4 md:px-12">
        {/* Desktop: Horizontal line edge to edge with container margin */}
        <div className="hidden md:block absolute bg-neutral-200 dark:bg-neutral-800 -z-10
                        left-4 right-4 md:left-12 md:right-12 
                        top-1/2 h-[2px] -translate-y-1/2" 
        />

        <div className="relative flex flex-col md:block w-full pb-16 md:pb-0 md:h-[400px]">
          {/* Main Continuous Line */}
          {/* Mobile: Vertical line. */}
          <div className="absolute bg-neutral-200 dark:bg-neutral-800 -z-10
                          left-8 top-0 bottom-0 w-[2px] md:hidden" 
          />

          {/* Nodes */}
          {experienceData.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === experienceData.length - 1;
            const isMiddle = !isFirst && !isLast;
            const percentage = (index / (experienceData.length - 1)) * 100;

            return (
              <div 
                key={item.id}
                className={`w-full md:w-max md:absolute md:top-0 md:h-full
                  ${isFirst ? 'md:left-0' : ''}
                  ${isLast ? 'md:right-0' : ''}
                  ${isMiddle ? 'md:-translate-x-1/2' : ''}
                `}
                style={isMiddle ? { left: `${percentage}%` } : undefined}
              >
                <ExperienceNode item={item} index={index} total={experienceData.length} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
