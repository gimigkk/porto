"use client";

import React from "react";
import { COMPANY_LOGOS, CompanyLogoItem } from "./CompanyLogos";

interface CompanyLogoGridProps {
  className?: string;
}

export default function CompanyLogoGrid({ className = "" }: CompanyLogoGridProps) {
  // Row 1 fits 4 logos edge-to-edge flush with title
  const row1 = COMPANY_LOGOS.slice(0, 4);
  // Row 2 displays the remaining logos
  const row2 = COMPANY_LOGOS.slice(4);

  return (
    <div className={`w-full flex flex-col gap-3 sm:gap-4 md:gap-5 ${className}`}>
      {/* Row 1: 4 logos edge-to-edge */}
      <div className="w-full flex items-center justify-between">
        {row1.map((logo: CompanyLogoItem, index: number) => {
          const isFirst = index === 0;
          const isLast = index === row1.length - 1;

          const alignClass = isFirst
            ? "justify-start"
            : isLast
              ? "justify-end"
              : "justify-center";

          const Content = (
            <img
              src={logo.src}
              alt={logo.name}
              className="w-auto h-[21px] sm:h-6 md:h-8 lg:h-9 max-w-[26vw] md:max-w-none object-contain opacity-70 hover:opacity-100 transition-opacity duration-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            />
          );

          const itemClass = `relative flex items-center shrink-0 ${alignClass}`;

          if (logo.href) {
            return (
              <a
                key={logo.id}
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                title={logo.name}
                className={`${itemClass} cursor-pointer`}
              >
                {Content}
              </a>
            );
          }

          return (
            <div
              key={logo.id}
              title={logo.name}
              className={`${itemClass} cursor-default`}
            >
              {Content}
            </div>
          );
        })}
      </div>

      {/* Row 2: Remaining logos centered */}
      {row2.length > 0 && (
        <div
          className={`w-full flex items-center ${row2.length >= 4
            ? "justify-between"
            : "justify-center gap-6 sm:gap-10 md:gap-14"
            }`}
        >
          {row2.map((logo: CompanyLogoItem, index: number) => {
            const isFirst = index === 0;
            const isLast = index === row2.length - 1;

            const alignClass =
              row2.length >= 4
                ? isFirst
                  ? "justify-start"
                  : isLast
                    ? "justify-end"
                    : "justify-center"
                : "justify-center";

            const Content = (
              <img
                src={logo.src}
                alt={logo.name}
                className="w-auto h-[21px] sm:h-6 md:h-8 lg:h-9 max-w-[26vw] md:max-w-none object-contain opacity-90 hover:opacity-100 transition-opacity duration-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              />
            );

            const itemClass = `relative flex items-center shrink-0 ${alignClass}`;

            if (logo.href) {
              return (
                <a
                  key={logo.id}
                  href={logo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={logo.name}
                  className={`${itemClass} cursor-pointer`}
                >
                  {Content}
                </a>
              );
            }

            return (
              <div
                key={logo.id}
                title={logo.name}
                className={`${itemClass} cursor-default`}
              >
                {Content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
