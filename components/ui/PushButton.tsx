"use client";

import React from "react";
import Link from "next/link";
import styles from "./PushButton.module.css";

interface PushButtonProps {
  children: React.ReactNode;
  variant?: "light" | "dark";
  href?: string;
  onClick?: () => void;
  className?: string;
  frontClassName?: string;
  frontStyle?: React.CSSProperties;
  ariaLabel?: string;
  isActive?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function PushButton({
  children,
  variant = "light",
  href,
  onClick,
  className = "",
  frontClassName = "",
  frontStyle,
  ariaLabel,
  isActive = false,
  type = "button",
}: PushButtonProps) {
  const isDark = variant === "dark";
  const edgeClass = isDark ? styles.edgeDark : styles.edge;
  const frontClass = isDark ? styles.frontDark : styles.front;
  const activeClass = isActive ? styles.simulateActive : "";

  const inner = (
    <span className={styles.animator}>
      <span className={styles.shadow} />
      <span className={edgeClass} />
      <span className={`${frontClass} ${frontClassName}`} style={frontStyle}>
        {children}
      </span>
    </span>
  );

  const buttonClasses = `${styles.pushable} ${activeClass} ${className}`.trim();

  if (href) {
    const isExternal = href.startsWith("http") || href.startsWith("mailto:");
    if (isExternal) {
      return (
        <a
          href={href}
          onClick={onClick}
          className={buttonClasses}
          aria-label={ariaLabel}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} className={buttonClasses} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={buttonClasses}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  );
}

export { styles as pushButtonStyles };
