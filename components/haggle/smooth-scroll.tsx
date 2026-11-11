"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { useReducedMotionPreference } from "@/lib/pointer";

/**
 * Weighty smooth scroll for the landing view only. Mounting this component is
 * what enables it, so the room and receipt keep native scrolling.
 */
export function SmoothScroll() {
  const reduce = useReducedMotionPreference();

  useEffect(() => {
    if (reduce) return;

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      smoothWheel: true,
      autoRaf: true,
    });

    return () => lenis.destroy();
  }, [reduce]);

  return null;
}
