"use client";

import {
  siNextdotjs, siReact, siTypescript, siTailwindcss, siCss, siNodedotjs,
  siPostgresql, siPrisma, siFirebase, siPython, siFigma, siDocker, siGit,
  siRust, siSupabase, siRedis, siGraphql, siMongodb, siExpress, siVite,
  siSvelte, siVuedotjs, siAstro, siGo, siWhatsapp, siGooglegemini,
  siSocketdotio, siVercel, siGithub, siLinux, siNginx, siGodotengine,
  siUnity, siBlender, siAndroid
} from "simple-icons";

const customCsharp = {
  title: "C#",
  svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>C Sharp</title><path d="M1.194 7.543v8.913c0 1.103.588 2.122 1.544 2.674l7.718 4.456a3.086 3.086 0 0 0 3.088 0l7.718-4.456a3.087 3.087 0 0 0 1.544-2.674V7.543a3.084 3.084 0 0 0-1.544-2.673L13.544.414a3.086 3.086 0 0 0-3.088 0L2.738 4.87a3.085 3.085 0 0 0-1.544 2.673Zm5.403 2.914v3.087a.77.77 0 0 0 .772.772.773.773 0 0 0 .772-.772.773.773 0 0 1 1.317-.546.775.775 0 0 1 .226.546 2.314 2.314 0 1 1-4.631 0v-3.087c0-.615.244-1.203.679-1.637a2.312 2.312 0 0 1 3.274 0c.434.434.678 1.023.678 1.637a.769.769 0 0 1-.226.545.767.767 0 0 1-1.091 0 .77.77 0 0 1-.226-.545.77.77 0 0 0-.772-.772.771.771 0 0 0-.772.772Zm12.35 3.087a.77.77 0 0 1-.772.772h-.772v.772a.773.773 0 0 1-1.544 0v-.772h-1.544v.772a.773.773 0 0 1-1.317.546.775.775 0 0 1-.226-.546v-.772H12a.771.771 0 1 1 0-1.544h.772v-1.543H12a.77.77 0 1 1 0-1.544h.772v-.772a.773.773 0 0 1 1.317-.546.775.775 0 0 1 .226.546v.772h1.544v-.772a.773.773 0 0 1 1.544 0v.772h.772a.772.772 0 0 1 0 1.544h-.772v1.543h.772a.776.776 0 0 1 .772.772Zm-3.088-2.315h-1.544v1.543h1.544v-1.543Z"/></svg>'
};

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
  godot:      siGodotengine,
  "socket.io": siSocketdotio,
  unity:      siUnity,
  csharp:     customCsharp,
  blender:    siBlender,
  android:    siAndroid,
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
