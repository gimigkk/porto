"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import TechIcon from "@/components/shared/TechIcon";

const TECH_STACK = [
  "react", "nextjs", "ts", "tailwind", "nodejs", "postgres", "figma", 
  "docker", "git", "python", "go", "redis", "vercel"
];

export default function TechMarquee({ trigger }: { trigger?: boolean } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const internalInView = useInView(ref, { once: true, margin: "-50px" });
  const isInView = trigger !== undefined ? trigger : internalInView;

  return (
    <div className="w-full overflow-hidden flex py-3" ref={ref}>
      <style>{`
        @keyframes scrollMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-scrollMarquee {
          animation: scrollMarquee 25s linear infinite;
        }
      `}</style>
      <div
        className={`flex whitespace-nowrap gap-4 md:gap-6 px-4 items-center ${isInView ? 'animate-scrollMarquee' : ''}`}
      >
        {/* Double the array for seamless infinite scroll */}
        {[...TECH_STACK, ...TECH_STACK].map((tech, i) => (
          <div 
            key={i} 
            className="flex items-center"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateX(0)" : "translateX(50px)",
              transition: `opacity 0.5s ease-out ${0.8 + i * 0.05}s, transform 0.5s ease-out ${0.8 + i * 0.05}s`
            }}
          >
            <TechIcon tech={tech} size={22} className="w-[14px] h-[14px] md:w-[22px] md:h-[22px] text-zinc-200 opacity-80" />
          </div>
        ))}
      </div>
    </div>
  );
}
