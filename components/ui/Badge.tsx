import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "glass" | "glass-muted" | "status";
  className?: string;
}

export default function Badge({
  children,
  variant = "glass",
  className = "",
}: BadgeProps) {
  const base = "font-mono tracking-wider rounded-[4px] shadow-md transition-colors";

  const variants = {
    glass:
      "text-[10px] md:text-[11px] font-bold uppercase text-white/90 bg-black/75 backdrop-blur-md px-2.5 py-1 border border-white/10",
    "glass-muted":
      "text-[10px] md:text-[11px] font-medium text-zinc-300 bg-black/75 backdrop-blur-md px-2 py-1 border border-white/10",
    status:
      "text-[11px] sm:text-xs font-sans font-medium text-white bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 inline-flex items-center gap-1.5 shadow-xs",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}
