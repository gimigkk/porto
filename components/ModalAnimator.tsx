"use client";

import { AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export default function ModalAnimator({ children }: { children: ReactNode }) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}
