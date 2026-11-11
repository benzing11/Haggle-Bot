import type { Mood } from "./types";

/**
 * Every mood in one place: the 3D orb, the CSS fallback and the room ambient
 * tint all read from these values, so a mood can never look different in two
 * corners of the app.
 */
export type MoodLook = {
  /** Highlight colour (emissive on the orb). */
  core: string;
  /** Surface colour of the sphere. */
  edge: string;
  /** Ambient glow, as an rgba() string for CSS. */
  glow: string;
  /** MeshDistortMaterial distortion, 0–0.6. */
  distort: number;
  /** Distortion animation speed. */
  speed: number;
  /** Emissive intensity, 0–1. */
  emissive: number;
  /** Vertical squash applied to the whole orb. */
  squash: number;
};

export const MOOD_LOOK: Record<Mood, MoodLook> = {
  delighted: {
    core: "#E7F7A6",
    edge: "#B7D86B",
    glow: "rgba(196, 226, 110, 0.40)",
    distort: 0.34,
    speed: 3.2,
    emissive: 0.6,
    squash: 1,
  },
  amused: {
    core: "#FFD784",
    edge: "#F5B94A",
    glow: "rgba(245, 185, 74, 0.40)",
    distort: 0.22,
    speed: 1.9,
    emissive: 0.44,
    squash: 1,
  },
  skeptical: {
    core: "#CBD3F7",
    edge: "#7C8AD8",
    glow: "rgba(124, 138, 216, 0.34)",
    distort: 0.15,
    speed: 0.85,
    emissive: 0.3,
    squash: 0.94,
  },
  offended: {
    core: "#FFB0A0",
    edge: "#E4523C",
    glow: "rgba(228, 82, 60, 0.40)",
    distort: 0.46,
    speed: 4.1,
    emissive: 0.52,
    squash: 1.03,
  },
  defeated: {
    core: "#A3B6B1",
    edge: "#51716C",
    glow: "rgba(95, 124, 118, 0.24)",
    distort: 0.05,
    speed: 0.3,
    emissive: 0.16,
    squash: 0.97,
  },
};
