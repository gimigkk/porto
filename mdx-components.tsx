import type { MDXComponents } from "mdx/types";
import React from "react";
import MermaidDiagram from "./components/ui/MermaidDiagram";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    div: ({ className, "data-chart": chart, children, ...props }: any) => {
      if (className === "language-mermaid" && chart) {
        return <MermaidDiagram chart={String(chart)} />;
      }
      return <div className={className} {...props}>{children}</div>;
    },
    code: ({ className, children, ...props }: any) => {
      const isInline = !className && !props["data-language"] && !props["data-theme"];
      const finalClass = isInline 
        ? "px-1.5 py-0.5 rounded-md bg-zinc-800/50 text-[var(--theme-color)] font-mono text-[0.875em]" 
        : className;

      return (
        <code className={finalClass} {...props}>
          {children}
        </code>
      );
    },
  };
}
