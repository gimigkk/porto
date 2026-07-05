"use client";

import { motion } from "framer-motion";
import { ExperienceNode } from "./ExperienceNode";
import experienceData from "@/lib/data/experience.json";

export default function ExperienceSection() {
  return (
    <section className="relative w-full overflow-hidden h-full flex items-start md:items-center [@media(min-height:900px)]:-mt-12">
      <div className="relative mx-auto w-full max-w-350 px-4 md:px-12 h-full">
        {/* Desktop: Horizontal line edge to edge with container margin */}
        <div className="hidden md:block absolute bg-neutral-200 dark:bg-neutral-800 -z-10
                        left-4 right-4 md:left-12 md:right-12 
                        top-1/2 h-[2px] -translate-y-1/2"
        />

        <div className="relative flex flex-col justify-between h-full max-h-[650px] md:max-h-none md:block w-full pt-2 pb-12 md:pt-0 md:pb-0 md:h-[500px] gap-4 md:gap-0">
          {/* Nodes */}
          {[...experienceData].reverse().map((item, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            const isMiddle = !isFirst && !isLast;
            const ratio = index / (arr.length - 1);

            return (
              <div
                key={item.id}
                className={`w-full md:w-max md:absolute md:top-0 md:h-full
                  ${isFirst ? 'md:left-0' : ''}
                  ${isLast ? 'md:right-0' : ''}
                  ${isMiddle ? 'md:-translate-x-1/2' : ''}
                `}
                style={isMiddle ? { left: `calc(162px + (100% - 324px) * ${ratio})` } : undefined}
              >
                <ExperienceNode item={item} index={index} total={arr.length} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
