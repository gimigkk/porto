"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import experienceData from "@/lib/data/experience.json";
import { ExperienceItem } from "@/types/experience";
import { ExperienceDetail } from "./ExperienceDetail";
import { ClothingRack } from "./ClothingRack";

const typedExperienceData = experienceData as ExperienceItem[];

export default function ExperienceSection() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.25 });

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
        {/* Desktop Header & Subheading (Hidden on mobile to fit screen) */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={
            isInView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 24, filter: "blur(6px)" }
          }
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex flex-col items-start mb-6 lg:mb-8 text-left"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Experience
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg" style={{ textWrap: "balance" }}>
            A timeline of my semi-professional journey, roles, and major contributions in the field of Computer Science.
          </p>
        </motion.div>

        {/* Main Interactive Stage with 2:3 Column Ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-[clamp(1rem,3.5vh,2.5rem)] sm:gap-6 lg:gap-12 items-start w-full overflow-visible">
          {/* Column 1 (2 parts): Staggered detail column */}
          <div className="lg:col-span-2 w-full overflow-visible">
            <ExperienceDetail item={selectedItem} isInView={isInView} />
          </div>

          {/* Column 2 (3 parts): Straight Clothing Rack (No containing border) */}
          <div className="lg:col-span-3 w-full flex flex-col items-center overflow-visible">
            <ClothingRack
              items={typedExperienceData}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
              isInView={isInView}
            />
          </div>
        </div>

        {/* Semantic HTML timeline for search engine crawlers & screen readers */}
        <ol className="sr-only" aria-label="Professional work experience timeline">
          {typedExperienceData.map((item) => (
            <li key={item.id}>
              <article>
                <h3>
                  {item.role} at {item.company}
                </h3>
                <p>
                  <span>{item.startDate}</span> — <span>{item.endDate}</span>
                </p>
                <p>{item.description}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
