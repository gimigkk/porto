"use client";

import React, { useEffect, useState } from "react";

// Initialize outside component so it runs before React renders children
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Prevent double initialization during HMR
  if (!(React as any).__REDUX_DEVTOOLS_EXTENSION__ && !(window as any).wdyrInitialized) {
    (window as any).wdyrInitialized = true;
    const whyDidYouRender = require("@welldone-software/why-did-you-render");
    whyDidYouRender(React, {
      trackAllPureComponents: true,
      trackHooks: true,
      logOwnerReasons: true,
      collapseGroups: true,
    });
  }
}

export function WdyrProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
