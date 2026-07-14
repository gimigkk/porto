"use client";

import React from "react";

// Initialize outside component so it runs before React renders children
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Prevent double initialization during HMR
  if (!(React as Record<string, unknown>).__REDUX_DEVTOOLS_EXTENSION__ && !(window as Window & { wdyrInitialized?: boolean }).wdyrInitialized) {
    (window as Window & { wdyrInitialized?: boolean }).wdyrInitialized = true;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const whyDidYouRender = require("@welldone-software/why-did-you-render");
    whyDidYouRender(React, {
      trackAllPureComponents: true,
      trackHooks: true,
      logOwnerReasons: true,
      collapseGroups: true,
      exclude: [/^BadgeLanyard/, /^CuboidCollider/, /^BallCollider/, /^Physics/, /^Canvas/, /^RigidBody/, /^group/, /^mesh/, /Unknown/, /forwardRef/],
    });
  }
}

export function WdyrProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
