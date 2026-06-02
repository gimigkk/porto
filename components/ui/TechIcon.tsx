"use client";

import * as si from "simple-icons";

/**
 * Maps our tech slug keys → simple-icons export names (si<TitleCase>).
 * Add new entries here when you add a new stack item.
 */
const slugToSiKey: Record<string, keyof typeof si> = {
  nextjs:     "siNextdotjs",
  react:      "siReact",
  ts:         "siTypescript",
  tailwind:   "siTailwindcss",
  css:        "siCss",
  nodejs:     "siNodedotjs",
  postgres:   "siPostgresql",
  prisma:     "siPrisma",
  firebase:   "siFirebase",
  python:     "siPython",
  figma:      "siFigma",
  docker:     "siDocker",
  git:        "siGit",
  rust:       "siRust",
  supabase:   "siSupabase",
  redis:      "siRedis",
  graphql:    "siGraphql",
  mongodb:    "siMongodb",
  express:    "siExpress",
  vite:       "siVite",
  svelte:     "siSvelte",
  vue:        "siVuedotjs",
  astro:      "siAstro",
  go:         "siGo",
  whatsapp:   "siWhatsapp",
  gemini:     "siGooglegemini",

  socketio:   "siSocketdotio",
  vercel:     "siVercel",
  github:     "siGithub",
  linux:      "siLinux",
  nginx:      "siNginx",
  axum:       "siRust",       // no axum icon → fallback Rust
  sqlx:       "siPostgresql", // no sqlx icon → fallback Postgres
};

/** Extract inner SVG path string from a simple-icons SVG string */
function extractSvgInner(svgStr: string): string {
  // simple-icons .svg property is the full <svg ...>...</svg>
  // We extract everything between the first > and last </svg>
  const start = svgStr.indexOf(">") + 1;
  const end = svgStr.lastIndexOf("</svg>");
  return svgStr.slice(start, end);
}

interface TechIconProps {
  tech: string;
  size?: number;
  className?: string;
  title?: string;
}

export default function TechIcon({
  tech,
  size = 16,
  className = "text-zinc-400",
  title,
}: TechIconProps) {
  const key = slugToSiKey[tech.toLowerCase()];
  const icon = key ? (si[key] as si.SimpleIcon) : null;

  if (!icon) {
    // Fallback: 2-char text badge
    return (
      <span
        className={`inline-flex items-center justify-center font-mono font-bold select-none ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
        title={title ?? tech}
      >
        {tech.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  const inner = extractSvgInner(icon.svg);

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-label={title ?? icon.title}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
