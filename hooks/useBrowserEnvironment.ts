"use client";

import { useSyncExternalStore } from "react";
import { MOBILE_MEDIA_QUERY } from "@/app/(home)/_components/layout/stackGeometry";

export interface BrowserEnvironment {
  isMobile: boolean;
  isChromium: boolean;
  needsWarning: boolean;
}

const SERVER_SNAPSHOT: BrowserEnvironment = {
  isMobile: false,
  isChromium: true,
  needsWarning: false,
};

let cachedClientSnapshot: BrowserEnvironment | null = null;
let lastMobileQueryMatch: boolean | null = null;

function getClientSnapshot(): BrowserEnvironment {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;

  const mobileMatch = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  if (cachedClientSnapshot && lastMobileQueryMatch === mobileMatch) {
    return cachedClientSnapshot;
  }

  const chromeMatch = Boolean((window as Window & { chrome?: unknown }).chrome);
  const isDismissed = Boolean(sessionStorage.getItem("browser-warning-dismissed"));
  const needsWarning = (mobileMatch || !chromeMatch) && !isDismissed;

  lastMobileQueryMatch = mobileMatch;
  cachedClientSnapshot = {
    isMobile: mobileMatch,
    isChromium: chromeMatch,
    needsWarning,
  };

  return cachedClientSnapshot;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
  const onMediaChange = () => {
    cachedClientSnapshot = null;
    callback();
  };

  mql.addEventListener("change", onMediaChange);
  window.addEventListener("resize", onMediaChange);

  return () => {
    mql.removeEventListener("change", onMediaChange);
    window.removeEventListener("resize", onMediaChange);
  };
}

export function useBrowserEnvironment(): BrowserEnvironment {
  return useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_SNAPSHOT);
}
