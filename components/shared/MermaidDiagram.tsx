"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        if (!containerRef.current) return;
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Read the actual hex code from the inherited CSS variable
        const computedColor = getComputedStyle(containerRef.current).getPropertyValue('--theme-color').trim() || "#71717a";

        // Build a muted version of the accent for borders (40% opacity feel)
        const r = parseInt(computedColor.slice(1, 3), 16);
        const g = parseInt(computedColor.slice(3, 5), 16);
        const b = parseInt(computedColor.slice(5, 7), 16);
        const mutedBorder = `rgb(${Math.round(r * 0.5 + 39)}, ${Math.round(g * 0.5 + 39)}, ${Math.round(b * 0.5 + 39)})`;
        const subtleFill = `rgb(${Math.round(r * 0.12 + 24)}, ${Math.round(g * 0.12 + 24)}, ${Math.round(b * 0.12 + 24)})`;

        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          themeVariables: {
            background: "#18181b",
            primaryColor: subtleFill,
            primaryTextColor: "#e4e4e7",
            textColor: "#a1a1aa",
            nodeTextColor: "#e4e4e7",
            mainBkg: subtleFill,
            nodeBorder: mutedBorder,
            primaryBorderColor: mutedBorder,
            lineColor: "#52525b",
            arrowheadColor: "#71717a",
            secondaryColor: "#27272a",
            tertiaryColor: "#27272a",
            clusterBkg: "rgba(255,255,255,0.03)",
            clusterBorder: "#3f3f46",
            titleColor: "#a1a1aa",
            edgeLabelBackground: "#18181b",
            fontSize: "13px",
          }
        });

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
