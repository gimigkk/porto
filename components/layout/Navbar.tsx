"use client";

import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, Menu, X } from "lucide-react";
import { useLenis } from "lenis/react";

interface SubLink {
  label: string;
  target: string;
  href?: string;
  external?: boolean;
}

interface NavItem {
  label: string;
  target: string;
  sublinks: SubLink[];
  isLogo?: boolean;
}

/** Maps nav target keys to actual DOM section IDs */
const TARGET_ID_MAP: Record<string, string> = {
  home: "home",
  about: "section-about",
  experience: "section-experience",
  "picked-projects": "section-projects",
  projects: "section-projects",
  "all-projects": "section-projects",
  "case-studies": "section-projects",
  "side-projects": "section-projects",
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "@gimigkk",
    target: "logo",
    isLogo: true,
    sublinks: [
      { label: "GitHub", target: "github", href: "https://github.com/gimigkk", external: true },
      { label: "Instagram", target: "instagram", href: "https://instagram.com/gimigkk", external: true },
    ],
  },
  {
    label: "Home",
    target: "home",
    sublinks: [
      { label: "About", target: "about" },
      { label: "Experience", target: "experience" },
      { label: "Picked Projects", target: "picked-projects" },
    ],
  },
  {
    label: "Project Archive",
    target: "projects",
    sublinks: [
      { label: "All Projects", target: "all-projects" },
      { label: "Case Studies", target: "case-studies" },
      { label: "Side Projects", target: "side-projects" },
    ],
  },
];

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

const parentVariants = {
  hidden: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { y: 8, opacity: 0, transition: { duration: 0.2, ease: easeOut } },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: easeOut },
  },
  exit: {
    y: -8,
    opacity: 0,
    transition: { duration: 0.2, ease: easeOut },
  },
};

export default function Navbar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredOffset, setHoveredOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gimigkkPanelOpen, setGimigkkPanelOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const lenis = useLenis();
  const innerNavRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Intro collapse logic (only on homepage)
  const [introCollapsed, setIntroCollapsed] = useState(pathname === "/");

  useEffect(() => {
    if (pathname !== "/") {
      setIntroCollapsed(false);
      return;
    }
    const onReady = () => setIntroCollapsed(false);
    window.addEventListener("hero-ready", onReady);
    return () => window.removeEventListener("hero-ready", onReady);
  }, [pathname]);

  // Derive which accordion index matches current route: 1=Home, 2=Project Archive
  const currentPageAccordion = pathname === "/projects" ? 2 : 1;

  // Deriving panel open state
  const anyPanelOpen = mobileMenuOpen || gimigkkPanelOpen;

  // Pause the ASCII canvas animation loop while mobile menu is open.
  // This frees the entire main thread (~30ms/frame) for smooth CSS transitions.
  useEffect(() => {
    if (anyPanelOpen) {
      window.dispatchEvent(new Event("ascii-pause"));
    } else {
      window.dispatchEvent(new Event("ascii-resume"));
    }
  }, [anyPanelOpen]);

  // Hide-on-scroll: hide navbar when scrolling down, show when scrolling up or at top.
  // Keep visible when panels (mobile/menu) or desktop dropdown is open to avoid jank.
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollYRef = useRef<number>(0);

  useEffect(() => {
    const THRESHOLD = 10; // minimal delta to consider
    const TOP_THRESHOLD = 50; // always show when near top

    function onScroll() {
      const current = window.scrollY || window.pageYOffset || 0;
      const last = lastScrollYRef.current;

      // small movements ignored
      if (Math.abs(current - last) < THRESHOLD) return;

      const isExpandedLocal = hoveredIndex !== null;

      // always show at top
      if (current <= TOP_THRESHOLD) {
        setNavVisible(true);
      } else if (mobileMenuOpen || gimigkkPanelOpen || isExpandedLocal) {
        // keep visible when menus/panels/dropdown open
        setNavVisible(true);
      } else if (current > last) {
        // scrolling down -> hide
        setNavVisible(false);
      } else {
        // scrolling up -> show
        setNavVisible(true);
      }

      lastScrollYRef.current = current;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobileMenuOpen, gimigkkPanelOpen, hoveredIndex]);

  const closeAll = useCallback(() => {
    setHoveredIndex(null);
    setMobileMenuOpen(false);
    setGimigkkPanelOpen(false);
    setActiveAccordion(null);
  }, []);

  const handleNavMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setActiveAccordion(null);
  }, []);

  const closeGimigkkPanel = useCallback(() => {
    setGimigkkPanelOpen(false);
    setActiveAccordion(null);
  }, []);

  const toggleGimigkkPanel = useCallback(() => {
    setGimigkkPanelOpen((prev) => !prev);
    setActiveAccordion(0);
    setMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => {
      if (!prev) {
        setActiveAccordion(currentPageAccordion);
        setGimigkkPanelOpen(false);
        return true;
      } else {
        setActiveAccordion(null);
        setGimigkkPanelOpen(false);
        return false;
      }
    });
  }, [currentPageAccordion]);

  const scrollTo = useCallback(
    (target: string) => {
      const sectionId = TARGET_ID_MAP[target] || target;

      if (sectionId === "home") {
        if (lenis) {
          lenis.scrollTo(0, { offset: 0 });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        if (lenis) {
          lenis.scrollTo(`#${sectionId}`, { offset: -48 });
        } else {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      }
      closeAll();
    },
    [lenis, closeAll]
  );

  const handleSublinkClick = useCallback(
    (sublink: SubLink) => {
      if (sublink.external && sublink.href) {
        window.open(sublink.href, "_blank", "noopener noreferrer");
      } else {
        scrollTo(sublink.target);
      }
      closeAll();
    },
    [scrollTo, closeAll]
  );

  const handleNavEnter = useCallback(
    (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
      setHoveredIndex(i);
      if (innerNavRef.current) {
        const btnRect = e.currentTarget.getBoundingClientRect();
        const innerRect = innerNavRef.current.getBoundingClientRect();
        setHoveredOffset(btnRect.left - innerRect.left);
      }
    },
    []
  );

  // Measure content height synchronously after hoveredIndex changes so
  // the dropdown height animation smoothly lerps between different sublink counts
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setContentHeight(el.scrollHeight || 0);
  }, [hoveredIndex]);

  const activeSublinks =
    hoveredIndex !== null ? NAV_ITEMS[hoveredIndex]?.sublinks ?? null : null;
  const isExpanded = hoveredIndex !== null;

  return (
    <>
      {/* Desktop page dimming backdrop */}
      <motion.div
        initial={{ opacity: 0 }} // Added initial state
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ opacity: { duration: 0.25, ease: easeOut } }}
        className="fixed inset-0 z-30 bg-black/10 hidden md:block"
        style={{ pointerEvents: isExpanded ? "auto" : "none" }}
        onClick={closeAll}
      />

      <nav
        className="fixed top-0 inset-x-0 z-[10000]"
        onMouseLeave={handleNavMouseLeave}
        style={{
          transform: (navVisible && !introCollapsed) ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 300ms cubic-bezier(0.22,1,0.36,1)",
          willChange: "transform",
        }}
      >
        {/* Thin bar */}
        <div className="w-full bg-white">
          <div
            ref={innerNavRef}
            className="h-12 flex items-center justify-between max-w-[1400px] mx-auto px-4 md:px-12"
          >
            {/* Left: @gimigkk always visible + desktop-only nav items */}
            <div className="flex items-center gap-8">
              {/* @gimigkk - mobile + desktop */}
              <button
                type="button"
                onClick={toggleGimigkkPanel}
                onMouseEnter={(e) => handleNavEnter(0, e)}
                className="flex items-center gap-1.5 text-sm font-semibold text-zinc-950 transition-colors duration-200 tracking-tight cursor-pointer focus:outline-none md:px-3 md:py-1.5"
              >
                <span>@gimigkk</span>
              </button>

              {/* Other nav items - desktop only */}
              <div className="hidden md:flex items-center gap-8">
                {NAV_ITEMS.slice(1).map((item, idx) => {
                  const i = idx + 1;
                  const isHovered = hoveredIndex === i;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => scrollTo(item.target)}
                      onMouseEnter={(e) => handleNavEnter(i, e)}
                      className="group/navlink flex items-center gap-1.5 text-sm font-medium text-zinc-700 transition-colors duration-200 tracking-tight px-3 py-1.5 rounded-full hover:bg-zinc-100 cursor-pointer focus:outline-none"
                    >
                      <span className={isHovered ? "text-zinc-950" : ""}>
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ease-out ${isHovered ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: hamburger (mobile only) */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="md:hidden flex items-center gap-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Right: CV button (desktop only) */}
            <a
              href="/cv.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Curriculum Vitae</span>
            </a>
          </div>
        </div>

        {/* Desktop dropdown */}
        <div className="hidden md:block">
          <motion.div
            initial={{ height: 0 }} // Added initial height to stop SSR flash
            animate={{
              height: isExpanded ? contentHeight : 0,
            }}
            transition={{
              height: {
                duration: 0.4,
                ease: easeOut,
              },
            }}
            className="overflow-hidden bg-white rounded-b-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-x border-b border-transparent"
          >
            <div
              ref={contentRef}
              className="max-w-[1400px] mx-auto px-4 md:px-12 py-6"
              style={{ paddingLeft: `${hoveredOffset + 16}px`, paddingRight: "1rem" }}
            >
              <AnimatePresence mode="popLayout">
                {activeSublinks && (
                  <motion.div
                    key={hoveredIndex}
                    variants={parentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col gap-4"
                  >
                    {activeSublinks.map((sublink) => (
                      <motion.button
                        key={sublink.label}
                        type="button"
                        variants={itemVariants}
                        onClick={() => handleSublinkClick(sublink)}
                        className="text-left text-base font-medium text-zinc-600 hover:text-zinc-950 transition-colors duration-200 tracking-tight w-fit cursor-pointer focus:outline-none"
                      >
                        {sublink.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* @gimigkk mobile panel */}
      <>
        <div
          className={`md:hidden fixed inset-0 z-40 bg-black/40 ${gimigkkPanelOpen ? "block" : "hidden"}`}
          onClick={closeGimigkkPanel}
        />

        <div
          className={`md:hidden fixed top-[47px] inset-x-0 z-45 max-h-[calc(100svh-48px)] overflow-y-auto bg-white border-t border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-b-2xl ${gimigkkPanelOpen ? "block" : "hidden"}`}
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {/* @gimigkk accordion */}
            <div>
              <button
                type="button"
                onClick={() =>
                  setActiveAccordion(activeAccordion === 0 ? null : 0)
                }
                className="flex items-center justify-between w-full py-3 text-sm font-medium text-zinc-800 hover:text-zinc-950 transition-colors duration-200 tracking-tight cursor-pointer focus:outline-none"
              >
                <span>Socials</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ease-out ${activeAccordion === 0 ? "rotate-180" : "rotate-0"
                    }`}
                />
              </button>

              <div
                className="grid overflow-hidden"
                style={{
                  gridTemplateRows: activeAccordion === 0 ? "1fr" : "0fr",
                  opacity: activeAccordion === 0 ? 1 : 0,
                }}
              >
                <div className="min-h-0">
                  <div className="pb-3 pl-2 flex flex-col gap-2 pt-1">
                    {NAV_ITEMS[0].sublinks.map((sublink) => (
                      <button
                        key={sublink.label}
                        type="button"
                        onClick={() => {
                          handleSublinkClick(sublink);
                          closeGimigkkPanel();
                        }}
                        className="text-left text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors duration-200 tracking-tight py-1.5 cursor-pointer focus:outline-none"
                      >
                        {sublink.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* Hamburger mobile panel */}
      <>
        <div
          className={`md:hidden fixed inset-0 z-40 bg-black/40 ${mobileMenuOpen ? "block" : "hidden"}`}
          onClick={closeMobileMenu}
        />

        <div
          className={`md:hidden fixed top-[47px] inset-x-0 z-45 max-h-[calc(100svh-48px)] overflow-y-auto bg-white border-t border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-b-2xl px-4 py-4 flex flex-col gap-1 ${mobileMenuOpen ? "block" : "hidden"}`}
        >
          {/* Home accordion + Project Archive accordion */}
          {NAV_ITEMS.slice(1).map((item, idx) => {
            const i = idx + 1;
            const isOpen = activeAccordion === i;

            return (
              <div key={item.label} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    // Navigate to route + expand this accordion
                    if (item.target === "projects") {
                      router.push("/projects");
                    } else {
                      router.push("/");
                    }
                    setActiveAccordion(i);
                  }}
                  className="flex items-center justify-between w-full py-3 text-sm font-medium text-zinc-800 hover:text-zinc-950 transition-colors duration-200 tracking-tight cursor-pointer focus:outline-none"
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : "rotate-0"
                      }`}
                  />
                </button>

                <div
                  className="grid overflow-hidden"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="min-h-0">
                    <div className="pb-3 pl-2 flex flex-col gap-2 pt-1">
                      {item.sublinks.map((sublink) => (
                        <button
                          key={sublink.label}
                          type="button"
                          onClick={() => {
                            handleSublinkClick(sublink);
                            closeMobileMenu();
                          }}
                          className="text-left text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors duration-200 tracking-tight py-1.5 cursor-pointer focus:outline-none"
                        >
                          {sublink.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CV button for mobile */}
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <a
              href="/cv.pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobileMenu}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Curriculum Vitae</span>
            </a>
          </div>
        </div>
      </>
    </>
  );
}