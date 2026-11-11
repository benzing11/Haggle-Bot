"use client";

import type { Options } from "canvas-confetti";

export async function celebrate(kind: "deal" | "paid") {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const confetti = (await import("canvas-confetti")).default;

  const base: Options = {
    spread: 70,
    ticks: 160,
    gravity: 0.9,
    decay: 0.92,
    scalar: 0.9,
    colors: ["#F5B94A", "#FF7A45", "#FFF4D6", "#3DDC97"],
    disableForReducedMotion: true,
  };

  if (kind === "deal") {
    void confetti({
      ...base,
      particleCount: 46,
      startVelocity: 26,
      origin: { y: 0.62 },
    });
    return;
  }

  void confetti({
    ...base,
    particleCount: 100,
    startVelocity: 42,
    origin: { y: 0.55 },
  });

  window.setTimeout(() => {
    void confetti({
      ...base,
      particleCount: 70,
      spread: 110,
      origin: { x: 0.18, y: 0.6 },
    });
  }, 180);

  window.setTimeout(() => {
    void confetti({
      ...base,
      particleCount: 70,
      spread: 110,
      origin: { x: 0.82, y: 0.6 },
    });
  }, 280);
}
