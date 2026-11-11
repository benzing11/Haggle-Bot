"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import type { Mood } from "@/lib/types";

type MoodStyle = {
  core: string;
  edge: string;
  glow: string;
  eyeScaleY: number;
  eyeRotate: number;
  mouth: number;
  brow: number;
};

export const MOOD_STYLES: Record<Mood, MoodStyle> = {
  delighted: {
    core: "#FFE7A8",
    edge: "#FF7A45",
    glow: "rgba(255, 170, 90, 0.55)",
    eyeScaleY: 0.55,
    eyeRotate: 10,
    mouth: 1,
    brow: -6,
  },
  amused: {
    core: "#FFD784",
    edge: "#C9852F",
    glow: "rgba(245, 185, 74, 0.42)",
    eyeScaleY: 0.9,
    eyeRotate: 4,
    mouth: 0.7,
    brow: 0,
  },
  skeptical: {
    core: "#D6D3E4",
    edge: "#6C6880",
    glow: "rgba(180, 180, 205, 0.32)",
    eyeScaleY: 0.5,
    eyeRotate: -12,
    mouth: 0.2,
    brow: 12,
  },
  offended: {
    core: "#FFB4B0",
    edge: "#B23747",
    glow: "rgba(255, 92, 108, 0.4)",
    eyeScaleY: 1.2,
    eyeRotate: -20,
    mouth: -0.5,
    brow: 22,
  },
  defeated: {
    core: "#9A98A6",
    edge: "#3B3A45",
    glow: "rgba(120, 120, 135, 0.24)",
    eyeScaleY: 0.12,
    eyeRotate: 0,
    mouth: -0.8,
    brow: 0,
  },
};

export const MOOD_LABEL: Record<Mood, string> = {
  delighted: "delighted",
  amused: "amused",
  skeptical: "skeptical",
  offended: "offended",
  defeated: "done with you",
};

export function BrindleOrb({
  mood,
  size = 96,
  className,
  breathe = true,
}: {
  mood: Mood;
  size?: number;
  className?: string;
  breathe?: boolean;
}) {
  const style = MOOD_STYLES[mood];
  const reduce = useReducedMotion();
  const ambient = breathe && !reduce;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-[-28%] rounded-full blur-2xl"
        animate={{
          backgroundColor: style.glow,
          scale: ambient ? [1, 1.07, 1] : 1,
          opacity: [0.75, 1, 0.75],
        }}
        transition={{
          backgroundColor: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          scale: ambient
            ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 },
          opacity: ambient
            ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 },
        }}
      />

      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        <defs>
          <filter id={`orb-soft-${mood}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <motion.circle
          cx="50"
          cy="50"
          r="36"
          animate={{ fill: style.edge, scale: ambient ? [1, 1.015, 1] : 1 }}
          transition={{
            fill: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
            scale: ambient
              ? { duration: 7, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 },
          }}
          style={{ transformOrigin: "50px 50px" }}
        />

        <motion.circle
          cx="44"
          cy="44"
          r="27"
          animate={{ fill: style.core }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          filter={`url(#orb-soft-${mood})`}
          opacity="0.9"
        />

        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="0.6"
        />

        <g>
          <motion.g
            animate={{
              scaleY: style.eyeScaleY,
              rotate: style.eyeRotate,
              y: style.brow * 0.06,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            style={{ transformOrigin: "50px 48px" }}
          >
            <ellipse cx="41" cy="48" rx="3.4" ry="5" fill="#16120B" />
            <ellipse cx="59" cy="48" rx="3.4" ry="5" fill="#16120B" />
            <circle cx="42.1" cy="46.4" r="1" fill="#FFF6E2" opacity="0.85" />
            <circle cx="60.1" cy="46.4" r="1" fill="#FFF6E2" opacity="0.85" />
          </motion.g>

          <motion.path
            animate={{
              d:
                style.mouth >= 0.5
                  ? "M45 61c3 3 7 3 10 0"
                  : style.mouth >= 0
                    ? "M45 60h10"
                    : "M45 62c3-3 7-3 10 0",
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            stroke="#16120B"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.8"
          />

          <motion.g
            animate={{ rotate: style.brow }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            style={{ transformOrigin: "50px 40px" }}
            stroke="#16120B"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity={mood === "offended" ? 0.85 : 0}
          >
            <path d="M36 40l8 3" />
            <path d="M64 40l-8 3" />
          </motion.g>
        </g>

        <motion.circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.5"
          strokeDasharray="2 6"
          animate={{ rotate: ambient ? 360 : 0 }}
          transition={
            ambient
              ? { duration: 40, repeat: Infinity, ease: "linear" }
              : { duration: 0.2 }
          }
          style={{ transformOrigin: "50px 50px" }}
        />
      </svg>
    </div>
  );
}
