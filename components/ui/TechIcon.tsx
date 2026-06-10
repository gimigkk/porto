"use client";

import {
  siNextdotjs, siReact, siTypescript, siTailwindcss, siCss, siNodedotjs,
  siPostgresql, siPrisma, siFirebase, siPython, siFigma, siDocker, siGit,
  siRust, siSupabase, siRedis, siGraphql, siMongodb, siExpress, siVite,
  siSvelte, siVuedotjs, siAstro, siGo, siWhatsapp, siGooglegemini,
  siSocketdotio, siVercel, siGithub, siLinux, siNginx,
} from "simple-icons";

/** Maps our tech slug → simple-icons icon data */
const iconMap: Record<string, { title: string; svg: string }> = {
  nextjs:     siNextdotjs,
  react:      siReact,
  ts:         siTypescript,
  tailwind:   siTailwindcss,
  css:        siCss,
  nodejs:     siNodedotjs,
  postgres:   siPostgresql,
  prisma:     siPrisma,
  firebase:   siFirebase,
  python:     siPython,
  figma:      siFigma,
  docker:     siDocker,
  git:        siGit,
  rust:       siRust,
  supabase:   siSupabase,
  redis:      siRedis,
  graphql:    siGraphql,
  mongodb:    siMongodb,
  express:    siExpress,
  vite:       siVite,
  svelte:     siSvelte,
  vue:        siVuedotjs,
  astro:      siAstro,
  go:         siGo,
  whatsapp:   siWhatsapp,
  gemini:     siGooglegemini,
  socketio:   siSocketdotio,
  vercel:     siVercel,
  github:     siGithub,
  linux:      siLinux,
  nginx:      siNginx,
  axum:       siRust,
  sqlx:       siPostgresql,
};

/** Extract inner SVG path string from a simple-icons SVG string */
function extractSvgInner(svgStr: string): string {
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
  const icon = iconMap[tech.toLowerCase()];

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
