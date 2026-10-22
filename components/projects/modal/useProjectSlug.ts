"use client";

import { useSyncExternalStore } from "react";

const subscribeToProjectSlug = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  window.addEventListener("project-modal-changed", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("project-modal-changed", callback);
    window.removeEventListener("hashchange", callback);
  };
};

const getProjectSlugSnapshot = () => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#project=")) {
    return hash.substring(9);
  }
  return null;
};

const getServerSnapshot = () => null;

export function useProjectSlug() {
  return useSyncExternalStore(subscribeToProjectSlug, getProjectSlugSnapshot, getServerSnapshot);
}

export function navigateToProjectSlug(slug: string | null) {
  if (typeof window === "undefined") return;
  if (slug) {
    const url = window.location.pathname + window.location.search + "#project=" + slug;
    window.history.pushState(null, "", url);
  } else {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.pushState(null, "", url.toString());
  }
  window.dispatchEvent(new Event("project-modal-changed"));
  window.dispatchEvent(new Event("hashchange"));
}
