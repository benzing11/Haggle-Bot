"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import {
  EYE_COLOUR,
  EYE_DIAMETER,
  EYE_GAP,
  EYE_LOOK,
  eyePath,
  type EyeMode,
  type EyeShape,
} from "@/lib/brindle-eyes";
import { usePointer } from "@/lib/pointer";
import type { Mood } from "@/lib/types";

/** Below this the pair sits still: a 30px orb cannot look anywhere useful. */
const TRACK_MIN_SIZE = 40;
/** Furthest the whole eye pair travels, as a fraction of the orb's radius. */
const TRACK_TRAVEL = 0.15;
/** Half of a blink: down in 80ms, back up in 80ms. */
const BLINK_HALF = 80;
const LID_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const SHAPE_MS = 400;

/**
 * Brindle's face. Two soft squircles laid over the orb — no iris, no pupil,
 * no anatomy. They always face the camera because they are part of the screen
 * rather than the sphere, which also means the distorted mesh can never clip
 * them and two moods can never z-fight.
 */
export function OrbEyes({
  mood,
  size,
  thinking = false,
  eyeMode = "live",
  track = true,
}: {
  mood: Mood;
  size: number;
  thinking?: boolean;
  eyeMode?: EyeMode;
  /** Mini orbs keep the shapes but lose the glance. */
  track?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const look = EYE_LOOK[mood];
  const pointer = usePointer();
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");

  const [blinking, setBlinking] = useState(false);
  const blinkStart = useRef<number | null>(null);
  const blinkEnd = useRef<number | null>(null);

  const tracking =
    track && !reduce && !thinking && pointer.enabled && size >= TRACK_MIN_SIZE;

  const travel = TRACK_TRAVEL * (size / 2);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, { stiffness: 100, damping: 18 });
  const y = useSpring(targetY, { stiffness: 100, damping: 18 });

  // The whole shape follows the cursor; it is a glance, not a strain.
  useEffect(() => {
    if (!tracking) {
      targetX.set(0);
      targetY.set(0);
      return;
    }
    const followX = (value: number) => targetX.set(value * travel);
    const followY = (value: number) => targetY.set(value * travel);
    followX(pointer.x.get());
    followY(pointer.y.get());
    const stopX = pointer.x.on("change", followX);
    const stopY = pointer.y.on("change", followY);
    return () => {
      stopX();
      stopY();
    };
  }, [tracking, travel, pointer.x, pointer.y, targetX, targetY]);

  // Blink on the mood's own rhythm, restarted whenever the mood changes.
  useEffect(() => {
    if (reduce || eyeMode === "still" || eyeMode === "closed") return;

    let cancelled = false;
    const oneShot = eyeMode === "celebrate";
    const nextGap = () =>
      (look.blink.min + Math.random() * (look.blink.max - look.blink.min)) *
      1000;

    const schedule = (delay: number) => {
      blinkStart.current = window.setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        blinkEnd.current = window.setTimeout(() => {
          if (cancelled) return;
          setBlinking(false);
          if (!oneShot) schedule(nextGap());
        }, BLINK_HALF);
      }, delay);
    };

    schedule(oneShot ? 420 : nextGap());

    return () => {
      cancelled = true;
      if (blinkStart.current) window.clearTimeout(blinkStart.current);
      if (blinkEnd.current) window.clearTimeout(blinkEnd.current);
      blinkStart.current = null;
      blinkEnd.current = null;
    };
  }, [mood, eyeMode, reduce, look.blink.min, look.blink.max]);

  if (size <= 0) return null;

  // One square box for both eyes; the mood is expressed in scale, never in
  // layout, so nothing reflows when Brindle's face changes.
  const box = EYE_DIAMETER * size * 1.3;
  const celebrate = eyeMode === "celebrate" ? 1.12 : 1;
  const closed = eyeMode === "closed" ? 0.18 : 1;
  const centreOffset = ((EYE_DIAMETER + EYE_GAP) / 2 + look.spread / 2) * size;
  const floatY = look.float * size;

  const shapeX = (shape: EyeShape) =>
    (EYE_DIAMETER * size * look.scale * celebrate * shape.scaleX) / box;
  const shapeY = (shape: EyeShape) =>
    (EYE_DIAMETER * size * look.scale * celebrate * shape.scaleY * closed) /
    box;

  const close = reduce ? 0 : look.blink.close;
  const lid = blinking ? 1 - close * 0.95 : 1;
  const shapeMs = reduce ? 0 : SHAPE_MS;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <motion.div
        className="relative h-full w-full"
        animate={thinking && !reduce ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={
          thinking && !reduce
            ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      >
        {([-1, 1] as const).map((side) => {
          const shape = side < 0 ? look.left : look.right;
          const path = eyePath(shape, side);
          const tilt = side < 0 ? shape.tilt : -shape.tilt;

          return (
            <div
              key={side}
              style={{
                position: "absolute",
                left: `calc(50% - ${side * centreOffset}px)`,
                top: `calc(50% - ${floatY}px)`,
                width: box,
                height: box,
                marginLeft: -box / 2,
                marginTop: -box / 2,
              }}
            >
              <motion.div
                className="h-full w-full"
                style={{ x, y, filter: `drop-shadow(0 0 ${Math.max(2, size * 0.018)}px rgba(237,232,216,0.45))` }}
              >
                <motion.div
                  className="h-full w-full"
                  animate={{ rotate: tilt }}
                  transition={{ duration: shapeMs, ease: "easeInOut" }}
                >
                  <motion.div
                    className="h-full w-full"
                    animate={{ scaleX: shapeX(shape), scaleY: shapeY(shape) }}
                    transition={{ duration: shapeMs, ease: "easeInOut" }}
                  >
                    <motion.div
                      className="h-full w-full"
                      animate={{ scaleY: lid }}
                      transition={{ duration: reduce ? 0 : BLINK_HALF / 1000, ease: LID_EASE }}
                    >
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="block h-full w-full overflow-visible"
                      >
                        <defs>
                          <radialGradient
                            id={`${gradientId}-${side}`}
                            cx="38%"
                            cy="28%"
                            r="80%"
                          >
                            <stop offset="0%" stopColor="#FFFDF5" />
                            <stop offset="58%" stopColor={EYE_COLOUR} />
                            <stop offset="100%" stopColor="#D7CFBA" />
                          </radialGradient>
                        </defs>
                        <path
                          d={path}
                          fill={`url(#${gradientId}-${side})`}
                        />
                      </svg>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
