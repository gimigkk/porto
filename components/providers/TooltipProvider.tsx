"use client";

import React, { createContext, useContext, useState, ReactNode, useRef } from "react";

interface TooltipContextType {
  isVisible: boolean;
  content: ReactNode | null;
  showTooltip: (content: ReactNode) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = (newContent: ReactNode) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setContent(newContent);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Delay clearing content so exit animation can play
    timeoutRef.current = setTimeout(() => {
      setContent(null);
    }, 200); 
  };

  return (
    <TooltipContext.Provider
      value={{ isVisible, content, showTooltip, hideTooltip }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltip() {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error("useTooltip must be used within a TooltipProvider");
  }
  return context;
}
