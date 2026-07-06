"use client";

import { motion } from "framer-motion";
import { ExperienceNode } from "./ExperienceNode";
import experienceData from "@/lib/data/experience.json";

export default function ExperienceSection() {
  return (
    <section className="relative w-full overflow-hidden h-full flex flex-col items-start md:justify-center [@media(min-height:900px)]:-mt-12">
      <div className="relative mx-auto w-full max-w-350 px-4 md:px-12 h-full md:h-auto">

        {/* -- Desktop Header (Absolutely positioned to overlap the empty space above the graph, preventing section overflow) -- */}
        <div className="hidden md:flex absolute -top-1 left-0 w-full px-12 flex-row items-end justify-between gap-6 pointer-events-auto z-20">
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Experience
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md" style={{ textWrap: 'balance' }}>
              A timeline of my semi-professional journey, roles, and major contributions in the field of Computer Science.
            </p>
          </div>
        </div>

        {/* Desktop: Horizontal line edge to edge with container margin */}
        <div className="hidden md:block absolute border-t-[2px] border-dotted border-neutral-300 dark:border-neutral-700 -z-10
                        left-4 right-4 md:left-12 md:right-12 
                        top-1/2 -translate-y-1/2"
        />

        <div className="relative flex flex-col-reverse justify-between h-full max-h-[650px] md:max-h-none md:block w-full pt-2 pb-12 md:pt-0 md:pb-0 md:h-[500px] gap-4 md:gap-0">
          
          {/* Mobile: Unified Vertical Timeline Line */}
          <div className="md:hidden absolute left-[15px] top-2 bottom-12 border-l-[2px] border-dotted border-neutral-300 dark:border-neutral-700 -z-10" />

          {/* Nodes */}
          {experienceData.map((item, index, arr) => {
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
