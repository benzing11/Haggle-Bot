"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Magic UI's Blur Fade, reimplemented on the shared motion tokens: a short
 * blur + lift that settles into place. Reduced motion renders the content
 * exactly where it belongs, with no animation at all.
 */
export function BlurFade({
  children,
  delay = 0,
  duration = 0.42,
  yOffset = 8,
  blur = "8px",
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("will-change-[opacity,transform,filter]", className)}
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}
