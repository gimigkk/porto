"use client";

import Link from "next/link";
import "./AnimatedButton.css";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export default function AnimatedButton({
  children,
  onClick,
  href,
  className = "",
}: AnimatedButtonProps) {
  const content = (
    <>
      <svg
        className="arr-2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
      </svg>
      <span className="text">{children}</span>
      <span className="circle"></span>
      <svg
        className="arr-1"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
      </svg>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`animated-button ${className}`} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button className={`animated-button ${className}`} onClick={onClick}>
      {content}
    </button>
  );
}
