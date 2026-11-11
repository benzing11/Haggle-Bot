"use client";

import { motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { EASE_OUT } from "@/lib/motion";
import { MOOD_LOOK } from "@/lib/mood";
import { usePointer, useReducedMotionPreference } from "@/lib/pointer";
import type { Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

const BrindleOrb3D = dynamic(() => import("./brindle-orb-3d"), {
  ssr: false,
  loading: () => null,
});

export const MOOD_LABEL: Record<Mood, string> = {
  delighted: "delighted",
  amused: "amused",
  skeptical: "skeptical",
  offended: "offended",
  defeated: "done with you",
};

/** WebGL is checked once per session; small orbs never spawn a canvas. */
let orbSupport: boolean | null = null;

function detectOrbSupport(): boolean {
  if (orbSupport !== null) return orbSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const memory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 8;
    orbSupport = Boolean(gl) && memory >= 4 && cores >= 4;
  } catch {
    orbSupport = false;
  }
  return orbSupport;
}

const subscribeNothing = () => () => {};

/**
 * True only for a large enough orb on a capable, motion-friendly device.
 * useSyncExternalStore keeps the server/hydration render deterministic.
 */
function useOrbCapable(size: number): boolean {
  const reduce = useReducedMotionPreference();
  const capable = useSyncExternalStore(
    subscribeNothing,
    () => size >= 40 && detectOrbSupport(),
    () => false,
  );
  return capable && !reduce;
}

export function BrindleOrb({
  mood,
  size = 96,
  className,
  breathe = true,
  thinking = false,
}: {
  mood: Mood;
  size?: number;
  className?: string;
  breathe?: boolean;
  thinking?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const look = MOOD_LOOK[mood];
  const { x, y } = usePointer();
  const capable = useOrbCapable(size);
  const ambient = breathe && !reduce;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-[-30%] rounded-full blur-2xl"
        animate={{
          backgroundColor: look.glow,
          scale: ambient ? [1, 1.06, 1] : 1,
          opacity: thinking ? [0.7, 1, 0.7] : [0.8, 1, 0.8],
        }}
        transition={{
          backgroundColor: { duration: 0.6, ease: EASE_OUT },
          scale: ambient
            ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 },
          opacity: thinking
            ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
            : ambient
              ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 },
        }}
      />

      {capable ? (
        <BrindleOrb3D
          mood={mood}
          thinking={thinking}
          pointerX={x}
          pointerY={y}
          size={size}
        />
      ) : (
        <FallbackOrb mood={mood} size={size} thinking={thinking} />
      )}
    </div>
  );
}

/**
 * Static gradient orb: reduced motion, low-power machines, no WebGL, and the
 * small inline avatars where a canvas would be pure waste.
 */
function FallbackOrb({
  mood,
  size,
  thinking,
}: {
  mood: Mood;
  size: number;
  thinking: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const look = MOOD_LOOK[mood];
  const withFace = size >= 34;

  return (
    <div data-orb-fallback className="relative h-full w-full">
      <motion.div
        className="absolute inset-[6%] rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 26%, ${look.core} 0%, ${look.edge} 58%, #241806 128%)`,
          boxShadow: `inset -4px -8px 16px rgba(0,0,0,0.35), 0 0 22px ${look.glow}`,
          scaleY: look.squash,
        }}
        animate={
          reduce
            ? undefined
            : thinking
              ? { scale: [1, 1.05, 1] }
              : { scale: [1, 1.015, 1] }
        }
        transition={{
          duration: thinking ? 1.2 : 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {withFace && (
        <>
          <span
            className="absolute rounded-full bg-[#15110A]"
            style={{
              width: size * 0.11,
              height: size * 0.15,
              left: `${38}%`,
              top: `${42}%`,
            }}
          />
          <span
            className="absolute rounded-full bg-[#15110A]"
            style={{
              width: size * 0.11,
              height: size * 0.15,
              left: `${54}%`,
              top: `${42}%`,
            }}
          />
        </>
      )}
    </div>
  );
}
