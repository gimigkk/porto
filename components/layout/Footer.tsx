"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLenis } from "lenis/react";
import { FileText, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const lenis = useLenis();
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (targetId: string) => {
    if (targetId.startsWith("http") || targetId.endsWith(".pdf") || targetId.startsWith("mailto:")) {
      window.open(targetId, "_blank", "noopener,noreferrer");
      return;
    }

    if (pathname !== "/") {
      if (targetId === "home") {
        router.push("/");
      } else {
        const hash = targetId.startsWith("section-") ? targetId : `section-${targetId}`;
        router.push(`/#${hash}`);
      }
      return;
    }

    if (targetId === "home") {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const selector = targetId.startsWith("#") ? targetId : `#${targetId}`;
    const element = document.querySelector(selector);
    if (element) {
      if (lenis) {
        lenis.scrollTo(element as HTMLElement, { offset: -48, duration: 1.2 });
      } else {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer role="contentinfo" className="w-full bg-gradient-to-b from-[#0c3888] to-[#50aaff] text-white relative overflow-hidden max-md:rounded-none rounded-t-lg sm:rounded-t-xl md:rounded-t-2xl">
      {/* Bottom-Left Halftone Flowers Graphic */}
      <div className="absolute bottom-0 -left-[15px] pointer-events-none z-0 opacity-30 sm:opacity-50 md:opacity-60 w-full max-w-full sm:max-w-[380px] md:max-w-[480px]">
        <Image
          src="/footer-flowers.png"
          alt=""
          width={1024}
          height={538}
          className="w-full h-auto object-cover object-bottom-left sm:object-contain"
          unoptimized
        />
      </div>

      <div className="w-full max-w-350 mx-auto px-4 md:px-12 py-10 sm:py-16 md:py-20 flex flex-col justify-between gap-10 sm:gap-16 relative z-10">
        {/* Main Content Flex Row */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 sm:gap-12 lg:gap-24 xl:gap-32">
          {/* Left Side: Logo & Description */}
          <div className="flex flex-col items-start gap-3 sm:gap-4 max-w-md">
            <button
              type="button"
              onClick={() => handleNavClick("home")}
              className="cursor-pointer focus:outline-none"
            >
              <Image
                src="/gimigkk-white.svg"
                alt="@gimigkk"
                width={707}
                height={222}
                className="h-7 sm:h-11 w-auto object-contain"
                priority
              />
            </button>

            <p className="text-white/90 text-xs sm:text-sm md:text-base font-medium leading-relaxed">
              Full-Stack Developer & Product Designer creating interactive digital experiences with craft & precision.
            </p>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-medium text-white shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Available for work
            </div>
          </div>

          {/* Right Side: Navigation Columns (Balanced flex justify-between across screen) */}
          <div className="flex flex-row justify-between items-start w-full sm:flex-wrap lg:flex-nowrap lg:flex-1 gap-2 sm:gap-8 lg:gap-10">
            {/* Column 1: Navigation (Hidden on Mobile) */}
            <div className="hidden sm:flex sm:flex-col gap-2 sm:gap-3">
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/70">
                Navigation
              </h3>
              <ul className="flex flex-col gap-2 sm:gap-2.5 text-[11px] sm:text-sm font-semibold text-white">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick("home")}
                    className="hover:text-white/70 transition-colors duration-200 cursor-pointer text-left"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick("section-about")}
                    className="hover:text-white/70 transition-colors duration-200 cursor-pointer text-left"
                  >
                    About Me
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick("section-experience")}
                    className="hover:text-white/70 transition-colors duration-200 cursor-pointer text-left"
                  >
                    Experience
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavClick("section-projects")}
                    className="hover:text-white/70 transition-colors duration-200 cursor-pointer text-left"
                  >
                    Picked Projects
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Work & Archive */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/70">
                Work & Archive
              </h3>
              <ul className="flex flex-col gap-2 sm:gap-2.5 text-[11px] sm:text-sm font-semibold text-white">
                <li>
                  <Link
                    href="/projects"
                    className="hover:text-white/70 transition-colors duration-200 inline-flex items-center gap-1"
                  >
                    All Projects <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projects"
                    className="hover:text-white/70 transition-colors duration-200"
                  >
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projects"
                    className="hover:text-white/70 transition-colors duration-200"
                  >
                    Side Projects
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Resumes */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/70">
                Resumes
              </h3>
              <ul className="flex flex-col gap-2 sm:gap-2.5 text-[11px] sm:text-sm font-semibold text-white">
                <li>
                  <a
                    href="/swe-resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/70 transition-colors duration-200 inline-flex items-center gap-1"
                  >
                    SWE Resume <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Connect */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/70">
                Connect
              </h3>
              <ul className="flex flex-col gap-2 sm:gap-2.5 text-[11px] sm:text-sm font-semibold text-white">
                <li>
                  <a
                    href="https://github.com/gimigkk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/70 transition-colors duration-200 inline-flex items-center gap-1"
                  >
                    GitHub <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/gimigkk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/70 transition-colors duration-200 inline-flex items-center gap-1"
                  >
                    Instagram <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:gimi.gkk@gmail.com"
                    className="hover:text-white/70 transition-colors duration-200 inline-flex items-center gap-1"
                  >
                    Email Me <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Text (Centered on mobile, right-aligned on desktop) */}
        <div className="flex items-center justify-center sm:justify-end w-full text-center sm:text-right text-[11px] sm:text-sm font-medium text-white pt-2 sm:pt-0">
          <p>© {new Date().getFullYear()} Gilang (@gimigkk). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
