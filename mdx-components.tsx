import type { MDXComponents } from "mdx/types";
import React from "react";
import MermaidDiagram from "./components/MermaidDiagram";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    code: ({ className, children, ...props }: any) => {
      if (className === "language-mermaid") {
        return <MermaidDiagram chart={String(children)} />;
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };
}
