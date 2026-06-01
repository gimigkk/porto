"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
        setHasError(false);
      } catch (e) {
        console.error("Failed to render Mermaid diagram", e);
        setHasError(true);
      }
    };

    if (chart) {
      renderDiagram();
    }
  }, [chart]);

  if (hasError) {
    return (
      <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 rounded-md my-4 font-mono text-sm">
        Failed to render Mermaid diagram.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center items-center w-full overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
