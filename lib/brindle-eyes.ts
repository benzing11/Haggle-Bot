import type { Mood } from "./types";

/**
 * Brindle's face, in one place. The WebGL orb and the CSS fallback both read
 * these numbers, so an expression can never look different in two corners of
 * the app. The sphere's own look lives in `lib/mood.ts` and is untouched.
 */

export type EyeMode = "live" | "celebrate" | "still" | "closed";

export type EyeShape = {
  /** Iris width multiplier (1 = 15% of the orb's diameter). */
  scaleX: number;
  /** Iris height multiplier; the brow is implied by squash + tilt only. */
  scaleY: number;
  /** Inner-corner drop in radians. Positive pulls the inner corner down. */
  tilt: number;
};

export type EyeLook = {
  left: EyeShape;
  right: EyeShape;
  pupil: {
    /** Resting pupil offset inside the iris, in iris radii (-1..1). */
    left: { x: number; y: number };
    right: { x: number; y: number };
    /** Pupil size relative to the iris. */
    scale: number;
  };
  /** Distance between iris centres, in orb radii (1 = one orb radius). */
  gap: number;
  /** Eye height above the orb's centre, in orb radii. */
  centerY: number;
  /** Vertical drift of the whole eye pair. */
  float: number;
  /** Slow orbital wobble amplitude (defeated only). */
  wobble: number;
  blink: { min: number; max: number; duration: number; close: number };
};

/** Iris diameter as a fraction of the orb's diameter. */
export const IRIS_DIAMETER = 0.15;
/** Iris radius in world units (the sphere has radius 1). */
export const IRIS_RADIUS = IRIS_DIAMETER;
/** Pupil radius as a fraction of the iris radius. */
export const PUPIL_RATIO = 0.42;

export const EYE_LOOK: Record<Mood, EyeLook> = {
  delighted: {
    left: { scaleX: 1.1, scaleY: 0.98, tilt: -0.05 },
    right: { scaleX: 1.1, scaleY: 0.98, tilt: -0.05 },
    pupil: {
      left: { x: 0, y: 0.06 },
      right: { x: 0, y: 0.06 },
      scale: 1.04,
    },
    gap: 0.8,
    centerY: 0.16,
    float: 0.012,
    wobble: 0,
    blink: { min: 3, max: 4, duration: 0.18, close: 1 },
  },
  amused: {
    left: { scaleX: 1, scaleY: 1, tilt: 0 },
    right: { scaleX: 1, scaleY: 0.82, tilt: 0.07 },
    pupil: {
      left: { x: 0, y: 0 },
      right: { x: -0.22, y: 0.02 },
      scale: 0.94,
    },
    gap: 0.8,
    centerY: 0.13,
    float: 0,
    wobble: 0,
    blink: { min: 4, max: 5, duration: 0.18, close: 1 },
  },
  skeptical: {
    left: { scaleX: 0.98, scaleY: 0.74, tilt: 0.13 },
    right: { scaleX: 0.98, scaleY: 0.74, tilt: 0.13 },
    pupil: {
      left: { x: 0, y: 0.18 },
      right: { x: 0, y: 0.18 },
      scale: 0.78,
    },
    gap: 0.86,
    centerY: 0.11,
    float: 0,
    wobble: 0,
    blink: { min: 5, max: 6, duration: 0.26, close: 1 },
  },
  offended: {
    left: { scaleX: 0.98, scaleY: 0.6, tilt: 0.28 },
    right: { scaleX: 0.98, scaleY: 0.6, tilt: 0.28 },
    pupil: {
      left: { x: 0, y: -0.04 },
      right: { x: 0, y: -0.04 },
      scale: 0.6,
    },
    gap: 0.74,
    centerY: 0.05,
    float: 0,
    wobble: 0,
    blink: { min: 1, max: 2, duration: 0.08, close: 1 },
  },
  defeated: {
    left: { scaleX: 1.02, scaleY: 1.08, tilt: -0.14 },
    right: { scaleX: 1.02, scaleY: 1.08, tilt: -0.14 },
    pupil: {
      left: { x: -0.18, y: -0.3 },
      right: { x: 0.2, y: -0.26 },
      scale: 1.14,
    },
    gap: 0.86,
    centerY: 0.08,
    float: -0.01,
    wobble: 0.006,
    blink: { min: 6, max: 8, duration: 0.4, close: 0.7 },
  },
};
