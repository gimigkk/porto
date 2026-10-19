"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import { getDocumentTop, readStackTop } from "@/components/layout/stackGeometry";
// ─── Types ──────────────────────────────────────────────────────

type ParallaxTarget =
  | string          // CSS selector — hook measures element height for maxShift
  | number          // explicit max shift in px
  | "auto"          // measure the element parallaxRef is attached to
  | null;           // no shift calc — just parallax via progress

interface ParallaxDockOptions {
  /** Dock anchor — CSS selector (docking element) or explicit px scroll position */
  dockAnchor: string | number;
  /** Optional offset added to dockAnchor (CSS length like "50px" or "5svh") */
  dockOffset?: string;
  /** How to determine max parallax shift */
  target?: ParallaxTarget;
  /** Fraction of target height left at dock (default 0 = scrolls fully out) */
  visibleFrac?: number;
  /** Parallax speed factor relative to scroll (0-1). 0.5 = moves at 50% scroll speed. */
  speed?: number;
  /** Initial speed relative to content (0-1) when using ease-out */
  startSpeed?: number;
  /** Motion curve: 'linear' (constant natural parallax) or 'ease-out' */
  easing?: "linear" | "ease-out";
  /** If true, parallax is disabled and transform resets to 0 */
  disabled?: boolean;
  /** Additional elements whose resize can move the dock anchor */
  observeSelectors?: readonly string[];
}

interface ParallaxDockResult {
  /** Attach this ref to the element that should parallax-move */
  parallaxRef: React.RefObject<HTMLDivElement | null>;
  /** Raw progress 0→1 for external tracking */
  progressRef: React.MutableRefObject<number>;
}

// ─── Hook ───────────────────────────────────────────────────────

export function useParallaxDock(options: ParallaxDockOptions): ParallaxDockResult {
  const {
    dockAnchor,
    target = "auto",
    visibleFrac = 0,
    speed = 0.5,
    startSpeed,
    easing = "linear",
    dockOffset,
    disabled = false,
    observeSelectors = [],
  } = options;

  const effectiveSpeed = startSpeed ?? speed;

  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const dockScrollRef = useRef(Infinity);
  const maxShiftRef = useRef(900);
  const currentY = useRef(0);


  // ── Apply transform directly (no React re-render) ──────────
  function applyTransform(y: number) {
    if (parallaxRef.current) {
      const rounded = Math.round(y * 10) / 10;
      parallaxRef.current.style.transform = `translate3d(0, ${rounded}px, 0)`;
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
    if (typeof dockAnchor === "number") {
      dockScrollRef.current = Math.max(0, dockAnchor);
    } else {
      const dockEl = document.querySelector(dockAnchor);
      if (dockEl) {
        const stackTop = dockEl instanceof HTMLElement ? readStackTop(dockEl) : 0;
        const top = dockEl instanceof HTMLElement
          ? getDocumentTop(dockEl)
          : dockEl.getBoundingClientRect().top + window.scrollY;
        let dockScroll = top - stackTop;
        if (dockOffset) dockScroll += parseCssLength(dockOffset);
        dockScrollRef.current = Math.max(0, dockScroll);
      }
    }

    const dock = dockScrollRef.current;
    if (dock > 0 && dock !== Infinity) {
      maxShiftRef.current = dock * effectiveSpeed;
    } else {
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
        maxShiftRef.current = h * (1 - visibleFrac);
      }
    }
  }, [dockAnchor, dockOffset, effectiveSpeed, target, visibleFrac]);

  // ── Parallax: linear or quadratic ease-out ──────────────────
  const update = useCallback((scroll: number) => {
    const dock = dockScrollRef.current;
    const maxShift = maxShiftRef.current;
    if (dock === Infinity || dock <= 0 || maxShift <= 0) return;

    const progress = Math.min(scroll / dock, 1);
    progressRef.current = progress;

    const factor = easing === "linear" ? progress : (2 * progress - progress * progress);
    const y = -factor * maxShift;
    if (y !== currentY.current) {
      currentY.current = y;
      applyTransform(y);
    }
  }, [easing]);

  const lenis = useLenis();

  useEffect(() => {
    let frameId = 0;
    let disposed = false;
    const scheduleMeasure = () => {
      if (disposed) return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (!disposed) {
          measure();
          update(lenis?.scroll ?? window.scrollY);
        }
      });
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const elements = new Set<Element>();
    const addSelector = (selector: string) => {
      const element = document.querySelector(selector);
      if (element) elements.add(element);
    };

    if (typeof dockAnchor === "string") addSelector(dockAnchor);
    if (typeof target === "string" && target !== "auto") addSelector(target);
    for (const selector of observeSelectors) addSelector(selector);
    if (target === "auto" && parallaxRef.current) elements.add(parallaxRef.current);
    for (const element of elements) resizeObserver.observe(element);

    window.addEventListener("resize", scheduleMeasure);
    void document.fonts.ready.then(scheduleMeasure);
    scheduleMeasure();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [dockAnchor, lenis, measure, observeSelectors, target, update]);

  useEffect(() => {
    if (disabled) {
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = "translateY(0px)";
      }
      return;
    }

    let lastScroll = -1;

    const applyScroll = (scroll: number) => {
      if (scroll !== lastScroll) {
        update(scroll);
        lastScroll = scroll;
      }
    };
    const onLenisScroll = (instance: Lenis) => applyScroll(instance.scroll);
    const onNativeScroll = () => applyScroll(window.scrollY);

    if (lenis) {
      lenis.on("scroll", onLenisScroll);
    } else {
      window.addEventListener("scroll", onNativeScroll, { passive: true });
    }

    applyScroll(lenis?.scroll ?? window.scrollY);

    return () => {
      if (lenis) {
        lenis.off("scroll", onLenisScroll);
      } else {
        window.removeEventListener("scroll", onNativeScroll);
      }
    };
  }, [disabled, update, lenis]);

  return { parallaxRef, progressRef };
}
