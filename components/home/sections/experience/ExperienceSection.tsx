"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Baby, Bed } from "lucide-react";
import { ExperienceNode } from "./ExperienceNode";
import experienceData from "@/lib/data/experience.json";

export default function ExperienceSection() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="relative w-full flex-1 h-full flex flex-col items-start md:justify-center [@media(min-height:900px)]:-mt-12">
      <div className="relative mx-auto w-full max-w-350 px-4 md:px-12 h-full md:h-auto max-md:flex max-md:flex-col max-md:flex-1">
        
        {/* Mobile Vertical Timeline Line Segment (Placed outside flex container to avoid any possible layout clipping) */}
        <div 
          className="md:hidden absolute left-[31px] w-[2px] border-l-[2px] border-dotted border-neutral-300 dark:border-neutral-700 -z-10 pointer-events-none" 
          style={{ top: '32px', bottom: '-2000px' }}
        />

        {/* -- Desktop Header (Absolutely positioned to overlap the empty space above the graph, preventing section overflow) -- */}
        <div className="hidden md:flex absolute -top-4 left-0 w-full px-12 flex-row items-end justify-between gap-6 pointer-events-none z-20">
          <div className="text-left pointer-events-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Experience
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md" style={{ textWrap: 'balance' }}>
              A timeline of my semi-professional journey, roles, and major contributions in the field of Computer Science.
            </p>
          </div>
        </div>

        {/* Desktop: Horizontal line edge to edge with start/end icons */}
        <div className="hidden md:flex absolute left-4 right-4 md:left-12 md:right-12 top-1/2 -translate-y-1/2 items-center -z-10">
          <Baby className="w-5 h-5 text-neutral-400 dark:text-neutral-600 shrink-0" />
          <div className="w-full border-t-[2px] border-dotted border-neutral-300 dark:border-neutral-700 mx-3" />
          <Bed className="w-5 h-5 text-neutral-400 dark:text-neutral-600 shrink-0" />
        </div>

        <div className="relative max-md:flex-1 flex flex-col-reverse justify-between h-full max-h-[650px] md:max-h-none md:block w-full pt-2 pb-12 md:pt-0 md:pb-0 md:h-[500px] gap-4 md:gap-0">

          {/* Nodes */}
          {experienceData.map((item, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            const isMiddle = !isFirst && !isLast;
            const ratio = index / (arr.length - 1);

            return (
              <div
                key={item.id}
                className={`w-full md:w-max md:absolute md:top-0 md:h-full pointer-events-none
                  ${isFirst ? 'md:left-0' : ''}
                  ${isLast ? 'md:right-0' : ''}
                  ${isMiddle ? 'md:-translate-x-1/2' : ''}
                `}
                style={isMiddle ? { left: `calc(162px + (100% - 324px) * ${ratio})` } : undefined}
              >
                <ExperienceNode item={item} index={index} total={arr.length} isInView={isInView} />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Hidden Image Preloader for Tooltips */}
      <div className="hidden">
        {experienceData.map((item) => (
          item.image && <img key={item.id} src={item.image} alt="preload" />
        ))}
      </div>
    </section>
  );
}
