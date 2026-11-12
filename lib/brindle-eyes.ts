import type { Mood } from "./types";

/**
 * Brindle's face, in one place. The WebGL orb, the CSS fallback and every mini
 * orb read these numbers, so an expression can never look different in two
 * corners of the app.
 *
 * Each eye is one soft squircle — no iris, no pupil, no anatomical parts. The
 * mood lives entirely in the shape: height, tilt, a bowed bottom edge, a
 * drooped outer corner, and how close the pair sits.
 */

export type EyeMode = "live" | "celebrate" | "still" | "closed";

export type EyeShape = {
  /** Width multiplier (1 = EYE_DIAMETER of the orb's diameter). */
  scaleX: number;
  /** Height multiplier. */
  scaleY: number;
  /**
   * Degrees of rotation. Positive tips the inner-top corner down toward the
   * nose, which is how a squircle grows a brow without any anatomy.
   */
  tilt: number;
  /** Upward bow of the bottom edge, as a fraction of the eye's height. */
  lift?: number;
  /** Extra stretch on the eye's outer bottom corner, as a fraction of height. */
  droop?: number;
};

export type EyeLook = {
  left: EyeShape;
  right: EyeShape;
  /** Overall size of the pair. */
  scale: number;
  /** Height above the orb's centre, as a fraction of its diameter. */
  float: number;
  /** Extra distance between the two eyes, as a fraction of the diameter. */
  spread: number;
  blink: { min: number; max: number; duration: number; close: number };
};

/** Each eye's diameter as a fraction of the orb's diameter. */
export const EYE_DIAMETER = 0.19;
/** Clear space between the two eyes, as a fraction of the orb's diameter. */
export const EYE_GAP = 0.28;
/** Squircle corner radius, as a percentage of the eye's shorter side. */
export const EYE_CORNER = 45;
/** Bottom corners are tighter, which leaves a real edge for a bow or a droop. */
export const EYE_CORNER_BOTTOM = 28;
/** Warm near-white; the glow is the sphere's own light caught in the face. */
export const EYE_COLOUR = "#EDE8D8";

export const EYE_LOOK: Record<Mood, EyeLook> = {
  delighted: {
    // A wide, slightly squinted pair arched upward at the outer corners.
    left: { scaleX: 1.02, scaleY: 0.94, tilt: -12 },
    right: { scaleX: 1.02, scaleY: 0.94, tilt: -12 },
    scale: 1.04,
    float: 0.02,
    spread: 0,
    blink: { min: 3, max: 4, duration: 0.16, close: 1 },
  },
  amused: {
    // One eye narrower and brow-cocked: a raised eyebrow, no brow required.
    left: { scaleX: 1, scaleY: 1, tilt: 0 },
    right: { scaleX: 1, scaleY: 0.78, tilt: 8 },
    scale: 1,
    float: 0,
    spread: 0,
    blink: { min: 4, max: 5, duration: 0.16, close: 1 },
  },
  skeptical: {
    // Flattened with a clear inward slant, drifting a little apart.
    left: { scaleX: 1.06, scaleY: 0.68, tilt: 11 },
    right: { scaleX: 1.06, scaleY: 0.68, tilt: 11 },
    scale: 1,
    float: 0.005,
    spread: 0.03,
    blink: { min: 5, max: 6, duration: 0.2, close: 1 },
  },
  offended: {
    // Compressed to slits with a sharp inward wedge, pulled together and down.
    left: { scaleX: 1.06, scaleY: 0.44, tilt: 28 },
    right: { scaleX: 1.06, scaleY: 0.44, tilt: 28 },
    scale: 0.96,
    float: -0.02,
    spread: -0.035,
    blink: { min: 1, max: 2, duration: 0.08, close: 1 },
  },
  defeated: {
    // Tall but heavy: the outer corners hang, top and bottom.
    left: { scaleX: 1, scaleY: 1.02, tilt: -5, droop: 0.16 },
    right: { scaleX: 1, scaleY: 1.02, tilt: -5, droop: 0.16 },
    scale: 1,
    float: -0.03,
    spread: 0.03,
    blink: { min: 6, max: 8, duration: 0.2, close: 0.6 },
  },
};

/**
 * One eye as an SVG path in a 100×100 box, stretched to the eye's real size.
 * `side` is -1 for the left eye and 1 for the right: the droop always lands on
 * the outer corner, so the pair reads as a face rather than two stamps.
 */
export function eyePath(shape: EyeShape, side: -1 | 1): string {
  const lift = (shape.lift ?? 0) * 100;
  const outerDrop = (shape.droop ?? 0) * 100;

  const leftDrop = side === -1 ? outerDrop : 0;
  const rightDrop = side === 1 ? outerDrop : 0;

  const topLeftY = 0;
  const topRightY = 0;

  const bottomLeftY = 100 + leftDrop;
  const bottomRightY = 100 + rightDrop;
  // Two controls a third of the way in: a smooth bow, never a pointed cusp.
  const bottomControlY = (bottomLeftY + bottomRightY) / 2 - lift * 1.6;

  // A steep brow eats into one side, so every corner gets the largest radius
  // that still fits its own edge. Without this the path folds on itself.
  const topCorner = (height: number) =>
    Math.max(2, Math.min(EYE_CORNER, height * 0.45));
  const bottomCorner = (height: number) =>
    Math.max(2, Math.min(EYE_CORNER_BOTTOM, height * 0.3));
  const rtl = topCorner(bottomLeftY - topLeftY);
  const rtr = topCorner(bottomRightY - topRightY);
  const rbl = bottomCorner(bottomLeftY - topLeftY);
  const rbr = bottomCorner(bottomRightY - topRightY);

  return [
    `M ${rtl} ${topLeftY}`,
    `L ${100 - rtr} ${topRightY}`,
    `Q 100 ${topRightY} 100 ${topRightY + rtr}`,
    `V ${bottomRightY - rbr}`,
    `Q 100 ${bottomRightY} ${100 - rbr} ${bottomRightY}`,
    `C ${100 - rbr - (100 - rbr - rbl) / 3} ${bottomControlY} ${rbl + (100 - rbr - rbl) / 3} ${bottomControlY} ${rbl} ${bottomLeftY}`,
    `Q 0 ${bottomLeftY} 0 ${bottomLeftY - rbl}`,
    `V ${topLeftY + rtl}`,
    `Q 0 ${topLeftY} ${rtl} ${topLeftY}`,
    "Z",
  ].join(" ");
}
