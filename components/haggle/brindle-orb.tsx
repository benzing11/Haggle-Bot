"use client";

import { motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { EYE_LOOK, IRIS_DIAMETER, PUPIL_RATIO, type EyeMode } from "@/lib/brindle-eyes";
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

/** Below this size the face is an iris-only simplification, no pupils. */
const PUPIL_MIN_SIZE = 44;
/** Below this size the CSS orb has no room for a face at all. */
const FACE_MIN_SIZE = 24;

export function BrindleOrb({
  mood,
  size = 96,
  className,
  breathe = true,
  thinking = false,
  eyeMode = "live",
}: {
  mood: Mood;
  size?: number;
  className?: string;
  breathe?: boolean;
  thinking?: boolean;
  /** `celebrate` = wide eyes + one slow blink; `closed` = lids stay lowered. */
  eyeMode?: EyeMode;
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
          eyeMode={eyeMode}
          compact={size < PUPIL_MIN_SIZE}
        />
      ) : (
        <FallbackOrb mood={mood} size={size} thinking={thinking} eyeMode={eyeMode} />
      )}
    </div>
  );
}

/**
 * Static gradient orb: reduced motion, low-power machines, no WebGL, and the
 * small inline avatars where a canvas would be pure waste. It carries the same
 * eye shapes as the WebGL orb, just without blink or pupil tracking.
 */
function FallbackOrb({
  mood,
  size,
  thinking,
  eyeMode,
}: {
  mood: Mood;
  size: number;
  thinking: boolean;
  eyeMode: EyeMode;
}) {
  const reduce = useReducedMotion() ?? false;
  const look = MOOD_LOOK[mood];
  const eyes = EYE_LOOK[mood];
  const withFace = size >= FACE_MIN_SIZE;
  const withPupils = size >= 40;

  const iris = IRIS_DIAMETER * size;
  const pupil = iris * PUPIL_RATIO * eyes.pupil.scale;
  const radius = size / 2;
  const lid = eyeMode === "closed" ? 0.2 : 1;
  const wide = eyeMode === "celebrate" ? 1.15 : 1;

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

      {withFace &&
        ([-1, 1] as const).map((sign) => {
          const shape = sign < 0 ? eyes.left : eyes.right;
          const centreX = radius + sign * (eyes.gap / 2) * radius;
          const centreY =
            radius - (eyes.centerY + eyes.float) * radius;

          return (
            <span key={sign}>
              <span
                className="absolute rounded-full"
                style={{
                  width: iris * shape.scaleX * wide,
                  height: iris * shape.scaleY * wide * lid,
                  left: centreX,
                  top: centreY,
                  transform: `translate(-50%, -50%) rotate(${
                    sign < 0 ? -shape.tilt : shape.tilt
                  }rad)`,
                  background:
                    "radial-gradient(circle at 38% 30%, #FFFFFF 0%, #EDE8D8 62%, #CFC6AE 100%)",
                  boxShadow: "0 0 6px rgba(237,232,216,0.45)",
                }}
              />
              {withPupils && lid > 0.45 && (
                <span
                  className="absolute rounded-full"
                  style={{
                    width: pupil,
                    height: pupil,
                    left:
                      centreX +
                      (sign < 0
                        ? eyes.pupil.left.x
                        : eyes.pupil.right.x) *
                        iris *
                        0.55,
                    top:
                      centreY +
                      (sign < 0
                        ? eyes.pupil.left.y
                        : eyes.pupil.right.y) *
                        iris *
                        0.55,
                    transform: "translate(-50%, -50%)",
                    background: "#0A0A0C",
                  }}
                />
              )}
            </span>
          );
        })}
    </div>
  );
}
