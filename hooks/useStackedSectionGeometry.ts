"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import {
  createStackRanges,
  getDocumentTop,
  getFolderDockMode,
  progressBetween,
  readStackTop,
  type FolderDockMode,
  type StackRanges,
} from "@/components/layout/stackGeometry";

interface SectionRefs {
  anchorRef: RefObject<HTMLDivElement | null>;
  rootRef: RefObject<HTMLDivElement | null>;
}

interface UseStackedSectionGeometryOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  about: SectionRefs;
  experience: SectionRefs;
  projects: SectionRefs;
}

interface DockModes {
  about: FolderDockMode;
  experience: FolderDockMode;
}

interface StackedSectionGeometryResult {
  stackProgress: MotionValue<number>;
  aboutFade: MotionValue<number>;
  experienceFade: MotionValue<number>;
  dockModes: DockModes;
  viewportProbeRef: RefObject<HTMLDivElement | null>;
}

const INITIAL_DOCK_MODES: DockModes = {
  about: "folder",
  experience: "folder",
};

function getIntrinsicFolderHeight(root: HTMLElement): number {
  const body = root.querySelector<HTMLElement>("[data-folder-body]");
  const tabRow = root.querySelector<HTMLElement>("[data-folder-tab-row]");
  const content = root.querySelector<HTMLElement>("[data-folder-content]");
  const clip = root.querySelector<HTMLElement>("[data-folder-content-clip]");

  if (!tabRow) return root.scrollHeight;
  if (!content || !clip) return (body?.scrollHeight ?? root.scrollHeight) + tabRow.offsetHeight;

  const reservedPadding = Math.max(0, content.offsetHeight - clip.clientHeight);
  return clip.scrollHeight + reservedPadding + tabRow.offsetHeight;
}

export function useStackedSectionGeometry({
  containerRef,
  about,
  experience,
  projects,
}: UseStackedSectionGeometryOptions): StackedSectionGeometryResult {
  const { rootRef: aboutRootRef } = about;
  const { rootRef: experienceRootRef } = experience;
  const { rootRef: projectsRootRef } = projects;
  const lenis = useLenis();
  const stackProgress = useMotionValue(0);
  const aboutFade = useMotionValue(0);
  const experienceFade = useMotionValue(0);
  const viewportProbeRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<StackRanges | null>(null);
  const lastScrollRef = useRef(0);
  const [dockModes, setDockModes] = useState<DockModes>(INITIAL_DOCK_MODES);

  const updateMotion = useCallback((scroll: number) => {
    const metrics = metricsRef.current;
    if (!metrics) return;

    stackProgress.set(progressBetween(scroll, metrics.aboutDock, metrics.projectsArrival));
    aboutFade.set(progressBetween(scroll, metrics.aboutDock, metrics.experienceDock));
    experienceFade.set(
      progressBetween(scroll, metrics.experienceDock, metrics.projectsArrival),
    );
  }, [aboutFade, experienceFade, stackProgress]);

  const measure = useCallback(() => {
    const aboutRoot = aboutRootRef.current;
    const experienceRoot = experienceRootRef.current;
    const projectsRoot = projectsRootRef.current;
    const viewportProbe = viewportProbeRef.current;

    if (
      !aboutRoot ||
      !experienceRoot ||
      !projectsRoot ||
      !viewportProbe
    ) return;

    const stackTops = {
      about: readStackTop(aboutRoot),
      experience: readStackTop(experienceRoot),
      projects: readStackTop(projectsRoot),
    };

    metricsRef.current = createStackRanges(
      {
        about: getDocumentTop(aboutRoot),
        experience: getDocumentTop(experienceRoot),
        projects: getDocumentTop(projectsRoot),
      },
      stackTops,
    );

    const smallViewportHeight = viewportProbe.offsetHeight;
    const nextDockModes: DockModes = {
      about: getFolderDockMode(
        getIntrinsicFolderHeight(aboutRoot),
        smallViewportHeight,
        stackTops.about,
        "flow",
      ),
      experience: getFolderDockMode(
        getIntrinsicFolderHeight(experienceRoot),
        smallViewportHeight,
        stackTops.experience,
      ),
    };

    setDockModes((current) => (
      current.about === nextDockModes.about && current.experience === nextDockModes.experience
        ? current
        : nextDockModes
    ));

    lastScrollRef.current = lenis?.scroll ?? window.scrollY;
    updateMotion(lastScrollRef.current);
  }, [
    aboutRootRef,
    experienceRootRef,
    lenis,
    projectsRootRef,
    updateMotion,
  ]);

  useEffect(() => {
    let frameId = 0;
    let disposed = false;

    const scheduleMeasure = () => {
      if (disposed) return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (!disposed) measure();
      });
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const observed = [
      containerRef.current,
      aboutRootRef.current,
      experienceRootRef.current,
      projectsRootRef.current,
      viewportProbeRef.current,
      document.getElementById("home"),
    ];

    for (const element of observed) {
      if (element) resizeObserver.observe(element);
    }

    window.addEventListener("resize", scheduleMeasure);
    void document.fonts.ready.then(scheduleMeasure);
    scheduleMeasure();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [aboutRootRef, containerRef, experienceRootRef, measure, projectsRootRef]);

  useEffect(() => {
    const setScroll = (scroll: number) => {
      lastScrollRef.current = scroll;
      updateMotion(scroll);
    };
    const onLenisScroll = (instance: Lenis) => setScroll(instance.scroll);
    const onNativeScroll = () => setScroll(window.scrollY);

    if (lenis) {
      lenis.on("scroll", onLenisScroll);
      setScroll(lenis.scroll);
    } else {
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      setScroll(window.scrollY);
    }

    return () => {
      if (lenis) {
        lenis.off("scroll", onLenisScroll);
      } else {
        window.removeEventListener("scroll", onNativeScroll);
      }
    };
  }, [lenis, updateMotion]);

  return {
    stackProgress,
    aboutFade,
    experienceFade,
    dockModes,
    viewportProbeRef,
  };
}
