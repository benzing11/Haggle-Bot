"use client";

import { motion, useTransform } from "motion/react";
import type { ReactNode } from "react";

import { usePointer } from "@/lib/pointer";
import { cn } from "@/lib/utils";

/**
 * Shifts its child by `depth` pixels in the pointer's direction. Depth 4–12px
 * reads as atmosphere; anything more starts to feel like a toy.
 */
export function Parallax({
  children,
  depth = 8,
  className,
}: {
  children: ReactNode;
  depth?: number;
  className?: string;
}) {
  const { x, y, enabled } = usePointer();
  const shiftX = useTransform(x, (value) => (enabled ? value * depth : 0));
  const shiftY = useTransform(y, (value) => (enabled ? value * depth : 0));

  return (
    <motion.div style={{ x: shiftX, y: shiftY }} className={cn(className)}>
      {children}
    </motion.div>
  );
}
