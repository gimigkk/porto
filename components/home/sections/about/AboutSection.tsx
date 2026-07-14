"use client";

import { IBM_Plex_Serif } from "next/font/google";
import { ArrowRight } from "lucide-react";
import GithubCommitGraph from "@/components/home/sections/about/GithubCommitGraph";
import TechMarquee from "@/components/home/sections/about/TechMarquee";
import ProfileFlipCard from "@/components/home/sections/about/ProfileFlipCard";
import BadgeLanyardCanvas from "@/components/home/sections/about/BadgeLanyardCanvas";
import styles from "@/components/home/SkipIntroButton.module.css";
import type { GithubGraphDay } from "@/lib/github";
import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";
import { useTooltip } from "@/components/providers/TooltipProvider";
import { NameTooltipContent } from "./tooltips/NameTooltipContent";
import { CampusTooltipContent } from "./tooltips/CampusTooltipContent";

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal"],
});

export default function AboutSection({ githubGraph }: { githubGraph: GithubGraphDay[][] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { showTooltip, hideTooltip } = useTooltip();

  const [isAnimationSettled, setIsAnimationSettled] = useState(false);

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => setIsAnimationSettled(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isInView]);

  const getTransition = (index: number) => ({
    transform: isInView ? "translateY(0%)" : "translateY(150%)",
    transition: `transform 0.6s cubic-bezier(0.33, 1, 0.68, 1) ${index * 0.1}s`
  });

  const getButtonTransition = (index: number) => ({
    transform: isInView ? "translateY(0%)" : "translateY(50%)",
    opacity: isInView ? 1 : 0,
    transition: `transform 0.6s cubic-bezier(0.33, 1, 0.68, 1) ${index * 0.1}s, opacity 0.6s cubic-bezier(0.33, 1, 0.68, 1) ${index * 0.1}s`
  });

  const getCardTransition = (delay: number) => ({
    transform: isInView ? "translateY(0px)" : "translateY(-30px)",
    opacity: isInView ? 1 : 0,
    filter: isInView ? "blur(0px)" : "blur(6px)",
    transition: `transform 0.6s cubic-bezier(0.33, 1, 0.68, 1) ${delay}s, opacity 0.6s cubic-bezier(0.33, 1, 0.68, 1) ${delay}s, filter 0.6s cubic-bezier(0.33, 1, 0.68, 1) ${delay}s`,
    willChange: (isAnimationSettled ? "auto" : "transform, opacity, filter") as any
  });

  return (
    <section
      id="about"
      ref={ref}
      className="w-full text-white pt-0 md:pt-8 flex flex-col items-center overflow-hidden md:overflow-visible"
    >
      {/* Use the exact same container padding and max-width as the Navbar */}
      <div className="w-full max-w-350 mx-auto px-4 md:px-12">

        {/* === MOBILE LAYOUT === */}
        <div className="flex md:hidden w-full gap-4 mb-4">
          <div className="flex flex-col flex-1 justify-between items-start">
            <div>
              <div className="overflow-hidden pb-3 -mb-3">
                <h2 style={getTransition(0)} className={`${ibmPlexSerif.className} text-3xl font-bold mb-1 tracking-tight leading-none text-zinc-100`}>
                  <span
                    className="cursor-default"
                    onMouseEnter={() => showTooltip(<NameTooltipContent />)}
                    onMouseLeave={hideTooltip}
                  >
                    Gilang
                  </span>
                </h2>
              </div>
              <div className="overflow-hidden pb-3 mb-3">
                <p style={getTransition(1)} className={`${ibmPlexSerif.className} text-sm leading-none text-zinc-300`}>
                  <span
                    className="cursor-default"
                    onMouseEnter={() => showTooltip(<NameTooltipContent />)}
                    onMouseLeave={hideTooltip}
                  >
                    /ɡˈi.laŋ/
                  </span>
                </p>
              </div>

              <div className="overflow-hidden pb-2 mb-3 w-max">
                <p style={getTransition(2)} className="text-[11px] leading-tight text-zinc-400 whitespace-nowrap w-max">
                  Undergraduate at <span
                    onMouseEnter={() => showTooltip(<CampusTooltipContent />)}
                    onMouseLeave={hideTooltip}
                  ><a href="https://ipb.ac.id/" target="_blank" rel="noopener noreferrer" className="group hover:text-white transition-colors">IPB University<sup className="text-[8px] ml-0.5 text-zinc-500 group-hover:text-zinc-300 transition-colors cursor-help inline-block">[?]</sup></a></span>.<br />
                  Building web applications, internal tools,<br />
                  event platforms, and digital experiences.<br />
                  Interested in engineering, and design.
                </p>
              </div>

              <div className="mb-10">
                <div style={getButtonTransition(6)}>
                  <button className={`${styles.pushable} group shrink-0`} aria-label="Technology">
                    <span className={styles.shadow}></span>
                    <span className={styles.edge}></span>
                    <span
                      className={`${styles.front} !flex items-center justify-center gap-1 whitespace-nowrap`}
                      style={{ padding: "6px 12px", fontSize: "11px" }}
                    >
                      <span>Technology</span>
                      <ArrowRight className="w-3 h-3 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45" />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-0.5 text-[11px] leading-none text-zinc-400">
              {["Fullstack Platform", "Company Website", "Event Website", "Internal Tools"].map((cat, i) => (
                <div key={cat} className="overflow-hidden pb-1 -mb-1">
                  <span style={getTransition(4 + i)} className={`${ibmPlexSerif.className} block`}>
                    {cat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex justify-end">
            <div
              className="relative w-full max-w-[160px] aspect-[4/5]"
              style={getCardTransition(0.3)}
            >
              <BadgeLanyardCanvas trigger={isInView} />
            </div>
          </div>
        </div>

        {/* Mobile Divider */}
        <hr className="md:hidden border-zinc-800 my-6" />

        {/* Sub-section 2: GitHub Graph + Marquee */}
        <div className="flex md:hidden flex-col gap-2 w-full overflow-hidden">
          <div className="flex justify-end w-full">
            <GithubCommitGraph data={githubGraph} delayBase={0.8} trigger={isInView} />
          </div>
          <div
            className="overflow-hidden w-full"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
          >
            <TechMarquee trigger={isInView} />
          </div>
        </div>


        {/* === DESKTOP LAYOUT === */}
        <div className="hidden md:flex w-full justify-between items-stretch h-[460px] mt-4">

          {/* Left Column */}
          <div className="flex flex-col items-start h-full w-[360px]">
            <div>
              <div className="overflow-hidden pb-4 -mb-4">
                <h2 style={getTransition(0)} className={`${ibmPlexSerif.className} text-6xl lg:text-7xl font-bold mb-1 tracking-tight text-zinc-100`}>
                  <span
                    className="cursor-default"
                    onMouseEnter={() => showTooltip(<NameTooltipContent />)}
                    onMouseLeave={hideTooltip}
                  >
                    Gilang
                  </span>
                </h2>
              </div>
              <div className="overflow-hidden pb-4 -mb-4">
                <p style={getTransition(1)} className={`${ibmPlexSerif.className} text-2xl lg:text-3xl text-zinc-300`}>
                  <span
                    className="cursor-default"
                    onMouseEnter={() => showTooltip(<NameTooltipContent />)}
                    onMouseLeave={hideTooltip}
                  >
                    /ɡˈi.laŋ/
                  </span>
                </p>
              </div>
            </div>

            <div className="overflow-hidden mt-[136px] pb-4 -mb-4 w-max">
              <p style={getTransition(2)} className="text-lg lg:text-xl leading-snug text-zinc-300 w-max">
                Undergraduate at <span
                  onMouseEnter={() => showTooltip(<CampusTooltipContent />)}
                  onMouseLeave={hideTooltip}
                ><a href="https://ipb.ac.id/" target="_blank" rel="noopener noreferrer" className="group hover:text-white transition-colors">IPB University<sup className="text-[10px] ml-0.5 text-zinc-500 group-hover:text-zinc-300 transition-colors cursor-help inline-block">[?]</sup></a></span>.<br />
                Building web applications, internal tools,<br />
                event platforms, and digital experiences.<br />
                Interested in engineering, and design.
              </p>
            </div>

            <div className="mt-12">
              <div style={getButtonTransition(6)}>
                <button className={`${styles.pushable} group shrink-0`} aria-label="Technology">
                  <span className={styles.shadow}></span>
                  <span className={styles.edge}></span>
                  <span
                    className={`${styles.front} !flex items-center justify-center gap-1 whitespace-nowrap`}
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                  >
                    <span>Technology</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45" />
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="flex-1 flex justify-center px-4 lg:px-8 h-full overflow-visible">
            <div
              className="relative h-full w-full max-w-[340px] overflow-visible"
              style={getCardTransition(0.3)}
            >
              <ProfileFlipCard src="/mukagw.JPG" alt="Gilang" sizes="(max-width: 768px) 160px, 340px" priority />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col items-end h-full text-right w-[360px]">
            <div className="flex flex-col items-end text-lg text-zinc-200">
              {["Fullstack Platform", "Company Website", "Event Website", "Internal Tools"].map((cat, i) => (
                <div key={cat} className="overflow-hidden pb-2 -mb-2">
                  <span style={getTransition(4 + i)} className={`${ibmPlexSerif.className} block`}>
                    {cat}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end w-full mt-28">
              <GithubCommitGraph data={githubGraph.slice(-26)} delayBase={0.6} trigger={isInView} />
            </div>

            <div className="overflow-hidden mt-12 w-full">
              <div
                className="flex justify-end w-full overflow-hidden"
                style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
              >
                <TechMarquee trigger={isInView} />
              </div>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
