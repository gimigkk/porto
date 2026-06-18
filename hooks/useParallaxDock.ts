"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLenis } from "lenis/react";

// ─── Types ──────────────────────────────────────────────────────

type ParallaxTarget =
  | string          // CSS selector — hook measures element height for maxShift
  | number          // explicit max shift in px
  | "auto"          // measure the element parallaxRef is attached to
  | null;           // no shift calc — just parallax via progress

interface ParallaxDockOptions {
  /** Dock anchor — CSS selector (bottom of element) or explicit px scroll position */
  dockAnchor: string | number;
  /** Optional offset added to dockAnchor (CSS length like "50px" or "5svh") */
  dockOffset?: string;
  /** How to determine max parallax shift */
  target?: ParallaxTarget;
  /** Fraction of target height left at dock (default 0 = scrolls fully out) */
  visibleFrac?: number;
  /** Initial speed relative to content (0-1). 0.5 = starts at 50% scroll speed, decelerates to 0. */
  startSpeed?: number;
  /** If true, parallax is disabled and transform resets to 0 */
  disabled?: boolean;
}

interface ParallaxDockResult {
  /** Attach this ref to the element that should parallax-move */
  parallaxRef: React.RefObject<HTMLDivElement | null>;
  /** Raw progress 0→1 for external tracking */
  progressRef: React.MutableRefObject<number>;
}

// ─── Hook ───────────────────────────────────────────────────────

export function useParallaxDock(options: ParallaxDockOptions): ParallaxDockResult {
  const { dockAnchor, target = "auto", visibleFrac = 0, startSpeed = 0.5, dockOffset, disabled = false } = options;

  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const dockScrollRef = useRef(Infinity);
  const maxShiftRef = useRef(900);
  const currentY = useRef(0);
  const lenis = useLenis();

  // ── Apply transform directly (no React re-render) ──────────
  function applyTransform(y: number) {
    if (parallaxRef.current) {
      parallaxRef.current.style.transform = `translateY(${y}px)`;
    }
  }

  // Parse CSS length string → px (only handles px/svh/dvh/vh)
  function parseCssLength(s: string): number {
    const match = s.match(/^([\d.]+)(px|svh|dvh|vh)$/);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = match[2];
    if (unit === "px") return val;
    return (val / 100) * window.innerHeight;
  }

  // ── Measure dock point + capped max shift ──────────────────
  const measure = useCallback(() => {
    // Dock: number (explicit px) or element bottom aligns with viewport bottom
    if (typeof dockAnchor === "number") {
      dockScrollRef.current = Math.max(0, dockAnchor);
    } else {
      const dockEl = document.querySelector(dockAnchor);
      if (dockEl) {
        const rect = dockEl.getBoundingClientRect();
        const absoluteBottom = rect.top + window.scrollY + rect.height;
        let dockScroll = absoluteBottom - window.innerHeight;
        if (dockOffset) dockScroll += parseCssLength(dockOffset);
        dockScrollRef.current = Math.max(0, dockScroll);
      }
    }

    const dock = dockScrollRef.current;

    // Max shift: number, selector, auto, or null
    let h = 0;
    if (typeof target === "number") {
      h = target;
    } else if (typeof target === "string") {
      const el = document.querySelector(target);
      if (el) h = el.getBoundingClientRect().height;
    } else if (target === "auto") {
      if (parallaxRef.current) h = parallaxRef.current.getBoundingClientRect().height;
    }
    if (h > 0) {
      // User-desired shift from visibleFrac
      const desired = h * (1 - visibleFrac);
      // Quadratic speed at t=0 = 2 * maxShift/dock. Cap so it never exceeds startSpeed.
      // Solve: 2 * maxShift / dock ≤ startSpeed → maxShift ≤ startSpeed * dock / 2
      const cap = dock > 0 ? (startSpeed * dock) / 2 : Infinity;
      maxShiftRef.current = Math.min(desired, cap);
    }
  }, [dockAnchor, target, visibleFrac, dockOffset, startSpeed]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // ── Parallax: quadratic ease-out = linear deceleration, always ──
  useEffect(() => {
    if (disabled) {
      if (parallaxRef.current) parallaxRef.current.style.transform = "translateY(0px)";
      return;
    }

    // f(t) = 2t - t². f'(t) = 2 - 2t. Speed drops linearly 2→0. Always decelerates.
    function update(scroll: number) {
      const dock = dockScrollRef.current;
      const maxShift = maxShiftRef.current;
      if (dock === Infinity || dock <= 0 || maxShift <= 0) return;

      const progress = Math.min(scroll / dock, 1);
      progressRef.current = progress;
      const eased = 2 * progress - progress * progress; // quadratic ease-out
      const y = -eased * maxShift;
      if (y !== currentY.current) {
        currentY.current = y;
        applyTransform(y);
      }
    }

    if (lenis) {
      const handler = (e: { scroll: number }) => update(e.scroll);
      lenis.on("scroll", handler);
      update(lenis.scroll ?? 0);
      return () => lenis.off("scroll", handler);
    }

    // Native fallback (Firefox / no Lenis)
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update(window.scrollY);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lenis, disabled]);

  return { parallaxRef, progressRef };
}