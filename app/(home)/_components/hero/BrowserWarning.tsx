"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion, useAnimationControls } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import SkipIntroButton from "@/app/(home)/_components/SkipIntroButton";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

interface BrowserWarningProps {
  isReady: boolean;
  isMobile: boolean;
  isChromium: boolean;
  onComplete: () => void;
}

export default function BrowserWarning({ isReady, isMobile, isChromium, onComplete }: BrowserWarningProps) {
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const containerControl = useAnimationControls();
  const [hasStartedOutro, setHasStartedOutro] = useState(false);

  const getMessage = () => {
    if (isMobile) {
      return "This website supports mobile, but mainly built for desktop for the full experience!";
    }
    if (!isChromium) {
      return "You are not using a chromium based browser, some elements of the website might be degraded, unsupported, or lagging hard.";
    }
    return "";
  };

  const handleContinue = useCallback(() => {
    if (hasStartedOutro) return;
    setHasStartedOutro(true);
    setTimeout(onComplete, 300);
  }, [hasStartedOutro, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpaceDown(false);
        handleContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleContinue]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={hasStartedOutro ? { opacity: 0 } : (isReady ? { opacity: 1 } : { opacity: 0 })}
      transition={{ duration: hasStartedOutro ? 0.3 : 0.6, ease: hasStartedOutro ? "easeIn" : "easeOut" }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center text-white pointer-events-none px-6 text-center"
    >
      <div className="mb-5 text-white/90 drop-shadow-sm scale-[1.1]">
        <AlertTriangle strokeWidth={1.5} size={32} />
      </div>

      <h2 className={`${plusJakartaSans.className} text-base md:text-2xl font-[500] max-w-4xl w-[90vw] md:w-auto opacity-90 drop-shadow-sm text-balance leading-relaxed mx-auto`}>
        {getMessage()}
      </h2>

      <div className="pointer-events-auto mt-4 md:mt-6 scale-[0.55] md:scale-[0.65] origin-top">
        <SkipIntroButton onClick={handleContinue} label="CONTINUE" isActive={isSpaceDown} isReady={isReady} />
      </div>
    </motion.div>
  );
}
