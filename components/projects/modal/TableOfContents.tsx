"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function collectHeadings(container: HTMLElement): TocItem[] {
  const elements = container.querySelectorAll<HTMLHeadingElement>(".prose h2, .prose h3");
  const items: TocItem[] = [];

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.offsetParent === null) continue; // Skip hidden elements

    const id = el.id;
    const text = el.textContent?.trim() || "";
    const level = parseInt(el.tagName[1], 10) || 2;

    if (id && text) {
      items.push({ id, text, level });
    }
  }

  return items;
}

export default function TableOfContents({
  accent,
  slug,
  scrollRef,
}: {
  accent: string;
  slug: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { lang } = useLanguage();
  const [activeId, setActiveId] = useState<string>("");
  const [headings, setHeadings] = useState<TocItem[]>([]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Imperative heading scan
    const foundHeadings = collectHeadings(container);
    setHeadings(foundHeadings);

    if (foundHeadings.length === 0) return;

    // Native IntersectionObserver — zero scroll-event math or rAF polling
    const observer = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        root: container,
        rootMargin: "0px 0px -70% 0px", // Trigger when heading enters top 30% of scroll container
        threshold: 0,
      }
    );

    for (let i = 0; i < foundHeadings.length; i++) {
      const headingEl = document.getElementById(foundHeadings[i].id);
      if (headingEl) {
        observer.observe(headingEl);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [slug, scrollRef, lang]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    const container = scrollRef.current;
    if (!target || !container) return;

    const offset = target.offsetTop - 24;
    container.scrollTo({ top: offset, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-3 py-1">
      <h3 className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">
        Contents
      </h3>
      <nav className="flex flex-col border-l border-zinc-800">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <button
              key={heading.id}
              type="button"
              title={heading.text}
              onClick={() => scrollToHeading(heading.id)}
              className={`block truncate text-left text-xs leading-5 py-1.5 transition-colors border-l-2 -ml-[1px] cursor-pointer ${
                isActive
                  ? "text-zinc-100 font-semibold"
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              } ${heading.level === 3 ? "pl-5 text-[11px]" : "pl-3"}`}
              style={{
                borderColor: isActive ? accent : "transparent",
              }}
            >
              {heading.text}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
