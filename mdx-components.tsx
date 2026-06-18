import type { MDXComponents } from "mdx/types";
import React from "react";
import MermaidDiagram from "./components/ui/MermaidDiagram";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    img: ({ src, alt, ...props }: any) => {
      const isVideo = src && (src.endsWith(".mp4") || src.endsWith(".webm"));
      if (isVideo) {
        return (
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-xl border border-zinc-800/50 my-8 shadow-2xl bg-zinc-900/50"
            {...props}
          />
        );
      }
      return (
        <img
          src={src}
          alt={alt}
          className="w-full rounded-xl border border-zinc-800/50 my-8 shadow-2xl bg-zinc-900/50"
          {...props}
        />
      );
    },
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
