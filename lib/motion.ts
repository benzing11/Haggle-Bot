import type { Transition } from "motion/react";

/**
 * One source of truth for every animation in the app. Timings and springs are
 * exported both as Motion transitions (seconds) and as CSS-ready values, so a
 * hover state and a layout transition can never drift apart.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Interactive chrome: buttons, taps, rings. */
export const SPRING_UI_OPTIONS = { stiffness: 260, damping: 26 } as const;
/** Ambient motion: heavier, more lag, less twitch. */
export const SPRING_SOFT_OPTIONS = { stiffness: 120, damping: 20 } as const;

export const SPRING_UI: Transition = { type: "spring", ...SPRING_UI_OPTIONS };
export const SPRING_SOFT: Transition = { type: "spring", ...SPRING_SOFT_OPTIONS };

export const DURATION = {
  /** 150–250ms: state flips, icon morphs, focus rings. */
  micro: 0.2,
  /** 400–600ms: panels, view changes, overlays. */
  panel: 0.5,
  /** 40–60ms between siblings. */
  stagger: 0.05,
} as const;

export const T = {
  micro: { duration: DURATION.micro, ease: EASE_OUT },
  panel: { duration: DURATION.panel, ease: EASE_OUT },
  ui: SPRING_UI,
  soft: SPRING_SOFT,
} as const;

/** Stagger helper: item N waits N * 50ms, plus any base delay. */
export function staggerDelay(index: number, base = 0): number {
  return base + index * DURATION.stagger;
}

/** CSS custom properties mirror the tokens above (see app/globals.css). */
export const MOTION_CSS_VARS = {
  "--ease-out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
  "--duration-micro": "200ms",
  "--duration-panel": "500ms",
  "--duration-stagger": "50ms",
} as const;
