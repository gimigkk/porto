"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { COMPANY_LOGOS, CompanyLogoItem } from "./CompanyLogos";

interface CompanyLogoGridProps {
  className?: string;
  ctaReady?: boolean;
  skipIntroAnimation?: boolean;
}

const logoVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: ({ index, skip }: { index: number; skip: boolean }) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: skip
      ? { duration: 0 }
      : {
          type: "spring",
          stiffness: 100,
          damping: 20,
          delay: index * 0.08,
          opacity: {
            type: "tween",
            duration: 0.4,
            ease: "linear",
            delay: index * 0.08,
          },
        },
  }),
};

export default function CompanyLogoGrid({
  className = "",
  ctaReady = false,
  skipIntroAnimation = false,
}: CompanyLogoGridProps) {
  // Row 1 fits 4 logos edge-to-edge flush with title
  const row1 = COMPANY_LOGOS.slice(0, 4);
  // Row 2 displays the remaining logos
  const row2 = COMPANY_LOGOS.slice(4);

  const initial = skipIntroAnimation ? "visible" : "hidden";
  const animState = ctaReady ? "visible" : "hidden";

  return (
    <div
      className={`w-full flex flex-col gap-3 sm:gap-4 md:gap-5 ${
        ctaReady ? "pointer-events-auto" : "pointer-events-none"
      } ${className}`}
    >
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
              className="w-auto h-[21px] sm:h-6 md:h-8 lg:h-9 max-w-[26vw] md:max-w-none object-contain opacity-80 hover:opacity-100 transition-opacity duration-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            />
          );

          const itemClass = `relative flex items-center shrink-0 ${alignClass}`;
          const custom = { index, skip: skipIntroAnimation };

          if (logo.href) {
            return (
              <motion.a
                key={logo.id}
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                title={logo.name}
                className={`${itemClass} cursor-pointer`}
                variants={logoVariants}
                initial={initial}
                animate={animState}
                custom={custom}
              >
                {Content}
              </motion.a>
            );
          }

          return (
            <motion.div
              key={logo.id}
              title={logo.name}
              className={`${itemClass} cursor-default`}
              variants={logoVariants}
              initial={initial}
              animate={animState}
              custom={custom}
            >
              {Content}
            </motion.div>
          );
        })}
      </div>

      {/* Row 2: Remaining logos centered */}
      {row2.length > 0 && (
        <div
          className={`w-full flex items-center ${
            row2.length >= 4
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
                className="w-auto h-[21px] sm:h-6 md:h-8 lg:h-9 max-w-[26vw] md:max-w-none object-contain opacity-80 hover:opacity-100 transition-opacity duration-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              />
            );

            const itemClass = `relative flex items-center shrink-0 ${alignClass}`;
            const globalIndex = row1.length + index;
            const custom = { index: globalIndex, skip: skipIntroAnimation };

            if (logo.href) {
              return (
                <motion.a
                  key={logo.id}
                  href={logo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={logo.name}
                  className={`${itemClass} cursor-pointer`}
                  variants={logoVariants}
                  initial={initial}
                  animate={animState}
                  custom={custom}
                >
                  {Content}
                </motion.a>
              );
            }

            return (
              <motion.div
                key={logo.id}
                title={logo.name}
                className={`${itemClass} cursor-default`}
                variants={logoVariants}
                initial={initial}
                animate={animState}
                custom={custom}
              >
                {Content}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
