"use client";

import React, { useEffect, useRef, useState } from "react";

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return { r, g, b };
    }
  }
  return { r: 113, g: 113, b: 122 };
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        if (!containerRef.current || !chart) return;
        const { default: mermaid } = await import("mermaid");
        if (cancelled) return;

        const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
        const computedColor = getComputedStyle(containerRef.current).getPropertyValue("--theme-color").trim() || "#71717a";
        const { r, g, b } = parseHexColor(computedColor);

        const mutedBorder = `rgb(${Math.round(r * 0.5 + 39)}, ${Math.round(g * 0.5 + 39)}, ${Math.round(b * 0.5 + 39)})`;
        const subtleFill = `rgb(${Math.round(r * 0.12 + 24)}, ${Math.round(g * 0.12 + 24)}, ${Math.round(b * 0.12 + 24)})`;

        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "strict",
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
          },
        });

        const { svg } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvgContent(svg);
          setHasError(false);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to render Mermaid diagram", e);
          setHasError(true);
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
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
