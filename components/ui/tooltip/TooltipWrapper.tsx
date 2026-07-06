"use client";

import React, { ReactNode } from "react";
import { useTooltip } from "@/components/providers/TooltipProvider";

interface TooltipWrapperProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}

export function TooltipWrapper({ children, content, className }: TooltipWrapperProps) {
  const { showTooltip, hideTooltip } = useTooltip();

  return (
    <div
      className={className || "inline-block"}
      onMouseEnter={() => showTooltip(content)}
      onMouseLeave={hideTooltip}
    >
      {children}
    </div>
  );
}
