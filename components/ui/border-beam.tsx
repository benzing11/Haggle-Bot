"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Adapted from Magic UI's Border Beam. A rotating conic gradient is masked to
 * the 1px border so the card's translucent surface stays intact, and the
 * animation itself only touches `transform`.
 */
export function BorderBeam({
  className,
  duration = 6,
  delay = 0,
  from = "#F5B94A",
  via = "#FF7A45",
  active = true,
}: {
  className?: string;
  duration?: number;
  delay?: number;
  from?: string;
  via?: string;
  active?: boolean;
}) {
  const reduce = useReducedMotion();
  if (!active || reduce) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] p-px",
        className,
      )}
      style={{
        WebkitMaskImage:
          "linear-gradient(#000 0 0), linear-gradient(#000 0 0)",
        WebkitMaskClip: "content-box, border-box",
        WebkitMaskComposite: "xor",
        maskImage: "linear-gradient(#000 0 0), linear-gradient(#000 0 0)",
        maskClip: "content-box, border-box",
        maskComposite: "exclude",
      }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[190%] -translate-x-1/2 -translate-y-1/2 opacity-80"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 292deg, ${from} 322deg, ${via} 348deg, transparent 360deg)`,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
