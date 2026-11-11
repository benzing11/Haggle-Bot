"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { clamp } from "@/lib/format";
import { SPRING_UI_OPTIONS } from "@/lib/motion";
import { usePointer } from "@/lib/pointer";
import { cn } from "@/lib/utils";

/**
 * Pulls its child toward the shared pointer while it is within `radius`, then
 * springs home. Reads the one pointer subscription — no per-element listeners.
 */
export function Magnetic({
  children,
  radius = 80,
  strength = 0.16,
  max = 12,
  className,
}: {
  children: ReactNode;
  radius?: number;
  strength?: number;
  max?: number;
  className?: string;
}) {
  const { enabled, subscribe } = usePointer();
  const ref = useRef<HTMLSpanElement>(null);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, SPRING_UI_OPTIONS);
  const y = useSpring(targetY, SPRING_UI_OPTIONS);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!enabled) {
      targetX.set(0);
      targetY.set(0);
      return;
    }

    let rect = element.getBoundingClientRect();
    let measureFrame = 0;

    const measure = () => {
      rect = element.getBoundingClientRect();
    };
    const measureSoon = () => {
      if (measureFrame) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        measure();
      });
    };

    const unsubscribe = subscribe((clientX, clientY) => {
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const reach = radius + Math.max(rect.width, rect.height) / 2;

      if (Math.hypot(dx, dy) > reach) {
        targetX.set(0);
        targetY.set(0);
        return;
      }

      targetX.set(clamp(dx * strength, -max, max));
      targetY.set(clamp(dy * strength, -max, max));
    });

    element.addEventListener("pointerenter", measure);
    window.addEventListener("resize", measureSoon);
    window.addEventListener("scroll", measureSoon, { passive: true });

    return () => {
      if (measureFrame) cancelAnimationFrame(measureFrame);
      unsubscribe();
      element.removeEventListener("pointerenter", measure);
      window.removeEventListener("resize", measureSoon);
      window.removeEventListener("scroll", measureSoon);
    };
  }, [enabled, max, radius, strength, subscribe, targetX, targetY]);

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      className={cn("inline-flex", className)}
    >
      {children}
    </motion.span>
  );
}
