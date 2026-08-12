"use client";

import { useState, useRef, useCallback, useLayoutEffect, useEffect, useReducer } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, Menu, X } from "lucide-react";
import { useLenis } from "lenis/react";
import {
  getDocumentTop,
  resolveSectionNavigationOffset,
  resolveSectionNavigationTarget,
} from "@/components/layout/stackGeometry";
import {
  INITIAL_NAVBAR_INTRO_STATE,
  isNavbarIntroCollapsed,
  navbarIntroReducer,
} from "@/components/layout/navbarIntroState";

interface SubLink {
  label: string;
  target: string;
  href?: string;
  external?: boolean;
  icon?: string;
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
  {
    label: "Curriculum Vitae",
    target: "cv",
    sublinks: [
      { label: "SWE Resume", target: "swe-resume", href: "/swe-resume.pdf", external: true, icon: "download" },
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

  // Root layouts persist across client navigation. Reset readiness in a layout
  // effect so a repeated homepage visit is collapsed before browser paint.
  const [introState, dispatchIntro] = useReducer(
    navbarIntroReducer,
    INITIAL_NAVBAR_INTRO_STATE,
  );
  const introCollapsed = isNavbarIntroCollapsed(pathname, introState);

  useLayoutEffect(() => {
    dispatchIntro({ type: "route-change", pathname });

    if (pathname !== "/") return;

    const onReady = () => dispatchIntro({ type: "intro-ready" });
    window.addEventListener("hero-phase2", onReady);

    return () => {
      window.removeEventListener("hero-phase2", onReady);
    };
  }, [pathname]);

  // Open Home accordion when mobile menu first opens.
  const currentPageAccordion = 1;

  // ASCII clouds pause/resume is handled by StackedSections on dock/undock.

  // Hide-on-scroll: hide navbar when scrolling down, show when scrolling up or at top.
  // Keep visible when panels (mobile/menu) or desktop dropdown is open to avoid jank.
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollYRef = useRef<number>(0);
  const menuStateRef = useRef({ mobileMenuOpen, gimigkkPanelOpen, hoveredIndex });
  
  useEffect(() => {
    menuStateRef.current = { mobileMenuOpen, gimigkkPanelOpen, hoveredIndex };
  }, [mobileMenuOpen, gimigkkPanelOpen, hoveredIndex]);

  const isNavbarOn = navVisible && !introCollapsed;

  useEffect(() => {
    document.documentElement.style.setProperty('--top-loader-color', isNavbarOn ? '#000000' : '#ffffff');
  }, [isNavbarOn]);

  useEffect(() => {
    const THRESHOLD = 10;
    const TOP_THRESHOLD = 50;
    let rafId = 0;

    function onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const current = window.scrollY || window.pageYOffset || 0;
        const last = lastScrollYRef.current;

        if (Math.abs(current - last) < THRESHOLD) return;

        const { mobileMenuOpen: mmo, gimigkkPanelOpen: gpo, hoveredIndex: hi } = menuStateRef.current;
        const isExpanded = hi !== null;

        if (current <= TOP_THRESHOLD) {
          setNavVisible(true);
        } else if (mmo || gpo || isExpanded) {
          setNavVisible(true);
        } else if (current > last) {
          setNavVisible(false);
        } else {
          setNavVisible(true);
        }

        lastScrollYRef.current = current;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []); // no deps — menu state read from ref

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
      if (target === "cv") return;
      const sectionId = TARGET_ID_MAP[target] || target;

      if (sectionId === "home") {
        if (lenis) {
          lenis.scrollTo(0, { offset: 0 });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        const element = document.getElementById(sectionId);
        if (!element) return;
        const targetElement = resolveSectionNavigationTarget(element) || element;
        const offset = resolveSectionNavigationOffset(element);
        const position = getDocumentTop(targetElement) + offset;
        if (lenis) {
          lenis.scrollTo(position);
        } else {
          window.scrollTo({ top: position, behavior: "smooth" });
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
  const isArchiveDropdown = hoveredIndex !== null && NAV_ITEMS[hoveredIndex]?.target === "projects";
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
        aria-label="Main Navigation"
        className="fixed top-0 inset-x-0 z-10000"
        onMouseLeave={handleNavMouseLeave}
        style={{
          transform: (navVisible && !introCollapsed) ? "translateY(0)" : "translateY(-100%)",
          opacity: introCollapsed ? 0 : 1,
          transition: "transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 300ms cubic-bezier(0.22,1,0.36,1)",
          willChange: "transform, opacity",
          pointerEvents: introCollapsed ? "none" : "auto",
        }}
      >
        {/* Thin bar */}
        <div className="w-full bg-white">
          <div
            ref={innerNavRef}
            className="h-12 flex items-center justify-between max-w-350 mx-auto px-4 md:px-12"
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
                <img src="/gimigkk-black.svg" alt="@gimigkk" className="h-[22px] w-auto object-contain " fetchPriority="high" />
              </button>

              {/* Main nav items - desktop only */}
              <div className="hidden md:flex items-center gap-8">
                {NAV_ITEMS.slice(1, -1).map((item, idx) => {
                  const i = idx + 1;
                  const isHovered = hoveredIndex === i;
                  const isArchive = item.target === "projects";
                  return (
                    <button
                      key={item.label}
                      type="button"
                      aria-label={isArchive ? "Project Archive unavailable" : item.label}
                      onClick={() => {
                        if (!isArchive) scrollTo(item.target);
                      }}
                      onMouseEnter={(e) => handleNavEnter(i, e)}
                      className={`group/navlink flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 tracking-tight px-3 py-1.5 rounded-full focus:outline-none ${isArchive
                        ? "text-zinc-400 cursor-pointer"
                        : "text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                        }`}
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

            {/* Right container */}
            <div className="flex items-center gap-4">
              {/* CV item - desktop only */}
              <div className="hidden md:flex items-center">
                {NAV_ITEMS.slice(-1).map((item) => {
                  const i = NAV_ITEMS.length - 1;
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
            </div>
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
              className="max-w-350 mx-auto px-4 md:px-12 py-6"
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
                        disabled={isArchiveDropdown}
                        aria-disabled={isArchiveDropdown}
                        onClick={() => {
                          if (!isArchiveDropdown) handleSublinkClick(sublink);
                        }}
                        className={`text-left text-base font-medium transition-colors duration-200 tracking-tight w-fit focus:outline-none flex items-center gap-2.5 pr-2 ${isArchiveDropdown
                          ? "text-zinc-400 cursor-not-allowed"
                          : "text-zinc-600 hover:text-zinc-950 cursor-pointer"
                          }`}
                      >
                        <span>{sublink.label}</span>
                        {sublink.icon === "download" && <Download className="w-4 h-4" />}
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
          className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm ${gimigkkPanelOpen ? "block" : "hidden"}`}
          onClick={closeGimigkkPanel}
        />

        <div
          className={`md:hidden fixed top-11.75 inset-x-0 z-45 max-h-[calc(100svh-48px)] overflow-y-auto bg-white border-t border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-b-2xl ${gimigkkPanelOpen ? "block" : "hidden"}`}
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
          className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm ${mobileMenuOpen ? "block" : "hidden"}`}
          onClick={closeMobileMenu}
        />

        <div
          className={`md:hidden fixed top-11.75 inset-x-0 z-45 max-h-[calc(100svh-48px)] overflow-y-auto bg-white border-t border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-b-2xl px-4 py-4 flex flex-col gap-1 ${mobileMenuOpen ? "block" : "hidden"}`}
        >
          {/* Home + Project Archive + CV accordions */}
          {NAV_ITEMS.slice(1).map((item, idx) => {
            const i = idx + 1;
            const isOpen = activeAccordion === i;
            const isArchive = item.target === "projects";

            return (
              <div key={item.label} className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-label={isArchive ? "Project Archive unavailable" : item.label}
                  onClick={() => {
                    if (isArchive) {
                      setActiveAccordion(isOpen ? null : i);
                      return;
                    }
                    // Keep mobile menu on homepage while expanding Home.
                    if (item.target !== "cv") {
                      router.push("/");
                    }
                    setActiveAccordion(i);
                  }}
                  className={`flex items-center justify-between w-full py-3 text-sm font-medium transition-colors duration-200 tracking-tight focus:outline-none ${isArchive
                    ? "text-zinc-400 cursor-pointer"
                    : "text-zinc-800 hover:text-zinc-950 cursor-pointer"
                    }`}
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
                          disabled={isArchive}
                          aria-disabled={isArchive}
                          onClick={() => {
                            if (isArchive) return;
                            handleSublinkClick(sublink);
                            closeMobileMenu();
                          }}
                          className={`flex items-center justify-between w-full text-left text-sm font-medium transition-colors duration-200 tracking-tight py-1.5 focus:outline-none ${isArchive
                            ? "text-zinc-400 cursor-not-allowed"
                            : "text-zinc-500 hover:text-zinc-950 cursor-pointer"
                            }`}
                        >
                          <span>{sublink.label}</span>
                          {sublink.icon === "download" && <Download className="w-4 h-4 mr-2" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    </>
  );
}
