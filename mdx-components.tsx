import dynamic from "next/dynamic";
import type { MDXComponents } from "mdx/types";
import React from "react";

const MermaidDiagram = dynamic(() => import("./components/shared/MermaidDiagram"), { ssr: false });

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      const isVideo = typeof src === "string" && (src.endsWith(".mp4") || src.endsWith(".webm"));
      if (isVideo) {
        return (
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-xl border border-zinc-800/50 my-8 shadow-2xl bg-zinc-900/50"
            {...(props as any)}
          />
        );
      }
      return (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full rounded-xl border border-zinc-800/50 my-8 shadow-2xl bg-zinc-900/50"
          {...props}
        />
      );
    },
    div: ({ className, "data-chart": chart, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { "data-chart"?: string }) => {
      if (className === "language-mermaid" && chart) {
        return <MermaidDiagram chart={String(chart)} />;
      }
      return <div className={className} {...props}>{children}</div>;
    },
    code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { "data-language"?: string, "data-theme"?: string }) => {
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
