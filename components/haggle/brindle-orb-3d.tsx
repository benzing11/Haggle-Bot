"use client";

import { MeshDistortMaterial } from "@react-three/drei";
import { createRoot, extend, useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import {
  EYE_LOOK,
  IRIS_RADIUS,
  PUPIL_RATIO,
  type EyeMode,
} from "@/lib/brindle-eyes";
import { MOOD_LOOK } from "@/lib/mood";
import type { Mood } from "@/lib/types";

type SceneProps = {
  mood: Mood;
  thinking: boolean;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  eyeMode: EyeMode;
  compact: boolean;
};

type DistortMaterial = THREE.MeshStandardMaterial & {
  distort: number;
  speed: number;
};

/** ~600ms mood crossfade: colours, distortion and speed all ease together. */
const MOOD_LAMBDA = 6;
const LEAN_LAMBDA = 4;
/** Eyes settle a touch faster than the body, but still never snap. */
const EYE_LAMBDA = 9;
/** Expelled: the lids come down slowly and stay there. */
const CLOSED_LAMBDA = 3;
/** Pupil travel toward the cursor. */
const FOLLOW_LAMBDA = 12;
/** Keeps the flat discs just clear of the distorted sphere. */
const IRIS_Z_LIFT = 0.015;

const IRIS_COLOUR = "#EDE8D8";
const PUPIL_COLOUR = "#0A0A0C";

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Symmetric cubic-bezier(0.4, 0, 0.2, 1)-ish easing for lids. */
function easeLid(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

type EyeSmooth = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  rz: number;
  ry: number;
  px: number;
  py: number;
  ps: number;
};

const START_EYE: EyeSmooth = {
  x: 0,
  y: 0.12,
  z: 0.94,
  sx: IRIS_RADIUS,
  sy: IRIS_RADIUS,
  rz: 0,
  ry: 0,
  px: 0,
  py: 0,
  ps: PUPIL_RATIO * IRIS_RADIUS,
};

// createRoot bypasses <Canvas>'s internal extend(THREE); register what the orb uses.
extend({
  AmbientLight: THREE.AmbientLight,
  PointLight: THREE.PointLight,
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  SphereGeometry: THREE.SphereGeometry,
  CircleGeometry: THREE.CircleGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
});

function Scene({
  mood,
  thinking,
  pointerX,
  pointerY,
  eyeMode,
  compact,
}: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);

  const irisLeft = useRef<THREE.Mesh>(null);
  const irisRight = useRef<THREE.Mesh>(null);
  const pupilLeft = useRef<THREE.Mesh>(null);
  const pupilRight = useRef<THREE.Mesh>(null);

  const squash = useRef(1);
  const time = useRef(0);
  const blink = useRef({ start: -1, next: 4 });
  const closed = useRef(1);
  const eyeSmooth = useRef({
    left: { ...START_EYE },
    right: { ...START_EYE },
  });

  const look = MOOD_LOOK[mood];
  const eyes = EYE_LOOK[mood];

  // Targets are memoised per mood so the frame loop only lerps toward them.
  const target = useMemo(
    () => ({
      color: new THREE.Color(look.edge),
      emissive: new THREE.Color(look.core),
      distort: look.distort,
      speed: look.speed,
      emissiveIntensity: look.emissive,
      squash: look.squash,
    }),
    [look],
  );

  // Blinks survive mood changes but their timer starts again from the new mood,
  // so an offended Brindle never inherits a relaxed 5s gap.
  useEffect(() => {
    blink.current.start = -1;
    if (eyeMode === "celebrate") {
      blink.current.next = time.current + 0.45;
    } else if (eyeMode === "closed" || eyeMode === "still") {
      blink.current.next = Number.POSITIVE_INFINITY;
    } else if (thinking) {
      blink.current.next = time.current + rand(7, 8);
    } else {
      blink.current.next = time.current + rand(eyes.blink.min, eyes.blink.max);
    }
  }, [mood, eyes, eyeMode, thinking]);

  useFrame((_, rawDelta) => {
    // Clamp delta: a backgrounded tab can return a huge value and snap things.
    const delta = Math.min(rawDelta, 0.05);
    time.current += delta;

    const material = mesh.current?.material as DistortMaterial | undefined;
    if (material) {
      material.color.lerp(target.color, 1 - Math.exp(-MOOD_LAMBDA * delta));
      material.emissive.lerp(target.emissive, 1 - Math.exp(-MOOD_LAMBDA * delta));
      material.emissiveIntensity = THREE.MathUtils.damp(
        material.emissiveIntensity,
        target.emissiveIntensity,
        MOOD_LAMBDA,
        delta,
      );
      material.distort = THREE.MathUtils.damp(
        material.distort,
        target.distort,
        MOOD_LAMBDA,
        delta,
      );
      material.speed = THREE.MathUtils.damp(
        material.speed,
        target.speed,
        MOOD_LAMBDA,
        delta,
      );
    }

    squash.current = THREE.MathUtils.damp(
      squash.current,
      target.squash,
      MOOD_LAMBDA,
      delta,
    );

    const px = pointerX.get();
    const py = pointerY.get();

    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        px * 0.34,
        LEAN_LAMBDA,
        delta,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -py * 0.24,
        LEAN_LAMBDA,
        delta,
      );

      const pulse = thinking
        ? 1 + Math.sin(time.current * 5.6) * 0.03
        : 1 + Math.sin(time.current * 1.5) * 0.012;

      group.current.scale.set(pulse, pulse * squash.current, pulse);
    }

    /* ------------------------------------------------------------ eyelid */

    let lid = 1;
    closed.current = THREE.MathUtils.damp(
      closed.current,
      eyeMode === "closed" ? 0.2 : 1,
      CLOSED_LAMBDA,
      delta,
    );

    if (eyeMode === "closed") {
      lid = closed.current;
    } else if (eyeMode === "still") {
      lid = 1;
    } else {
      const b = blink.current;
      if (b.start < 0 && time.current >= b.next) b.start = time.current;

      if (b.start >= 0) {
        const duration =
          eyeMode === "celebrate"
            ? 0.5
            : thinking
              ? Math.max(eyes.blink.duration, 0.22)
              : eyes.blink.duration;
        const progress = (time.current - b.start) / duration;

        if (progress >= 1) {
          b.start = -1;
          b.next =
            eyeMode === "celebrate"
              ? Number.POSITIVE_INFINITY
              : time.current + rand(eyes.blink.min, eyes.blink.max);
        } else {
          const close = eyeMode === "celebrate" ? 0.95 : eyes.blink.close;
          lid = 1 - close * easeLid(progress);
        }
      }
    }

    /* ----------------------------------------------------------- thinking */

    const breathe = thinking
      ? 1 + 0.025 * (1 + Math.sin(time.current * ((2 * Math.PI) / 1.2)))
      : 1;
    const celebrate = eyeMode === "celebrate";
    const irisBase = IRIS_RADIUS * (celebrate ? 1.15 : 1);
    const tracking = eyeMode === "live" || eyeMode === "celebrate";
    const travel = 0.25 * irisBase;

    const sides = [
      { key: "left" as const, sign: -1, shape: eyes.left, iris: irisLeft, pupil: pupilLeft },
      { key: "right" as const, sign: 1, shape: eyes.right, iris: irisRight, pupil: pupilRight },
    ];

    for (const side of sides) {
      const smooth = eyeSmooth.current[side.key];

      const ex = (eyes.gap / 2) * side.sign;
      const wobble =
        eyes.wobble > 0
          ? Math.sin(time.current * 1.1 + (side.sign > 0 ? 1.3 : 0)) * eyes.wobble
          : 0;
      const ey = eyes.centerY + eyes.float + wobble;
      const ez =
        Math.sqrt(Math.max(0.05, 1 - ex * ex - ey * ey)) + IRIS_Z_LIFT;
      // Eyes lie on the sphere and turn with its surface toward the camera.
      const ry = Math.atan2(ex, ez) * 0.85;

      smooth.sx = THREE.MathUtils.damp(
        smooth.sx,
        irisBase * side.shape.scaleX,
        EYE_LAMBDA,
        delta,
      );
      smooth.sy = THREE.MathUtils.damp(
        smooth.sy,
        irisBase * side.shape.scaleY * breathe,
        EYE_LAMBDA,
        delta,
      );
      smooth.rz = THREE.MathUtils.damp(
        smooth.rz,
        side.sign < 0 ? -side.shape.tilt : side.shape.tilt,
        EYE_LAMBDA,
        delta,
      );
      smooth.x = THREE.MathUtils.damp(smooth.x, ex, EYE_LAMBDA, delta);
      smooth.y = THREE.MathUtils.damp(smooth.y, ey, EYE_LAMBDA, delta);
      smooth.z = THREE.MathUtils.damp(smooth.z, ez, EYE_LAMBDA, delta);
      smooth.ry = THREE.MathUtils.damp(smooth.ry, ry, EYE_LAMBDA, delta);

      if (side.iris.current) {
        side.iris.current.position.set(smooth.x, smooth.y, smooth.z);
        side.iris.current.scale.set(
          Math.max(0.001, smooth.sx),
          Math.max(0.001, smooth.sy * lid),
          1,
        );
        side.iris.current.rotation.set(0, smooth.ry, smooth.rz);
      }

      if (side.pupil.current) {
        // Cursor first, then the mood's resting gaze. Both stay inside the iris.
        const trackX = tracking && !thinking ? px * travel : 0;
        const trackY = tracking && !thinking ? -py * travel : 0;
        // Thinking: the gaze drifts to the middle of the iris, looking inward.
        const rest = thinking ? { x: 0, y: 0 } : eyes.pupil[side.key];
        let dx = rest.x * irisBase * 0.55 + trackX;
        let dy = rest.y * irisBase * 0.55 + trackY;

        const limitX = Math.max(0.02, smooth.sx * 0.5);
        const limitY = Math.max(0.02, smooth.sy * 0.5);
        const over = Math.hypot(dx / limitX, dy / limitY);
        if (over > 1) {
          dx /= over;
          dy /= over;
        }

        // The iris may be tilted; rotate the pupil offset with it.
        const cos = Math.cos(smooth.rz);
        const sin = Math.sin(smooth.rz);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        smooth.px = THREE.MathUtils.damp(smooth.px, localX, FOLLOW_LAMBDA, delta);
        smooth.py = THREE.MathUtils.damp(smooth.py, localY, FOLLOW_LAMBDA, delta);

        // A pupil that cannot fit in a closing lid simply slips behind it.
        const visible = THREE.MathUtils.clamp((lid - 0.15) / 0.5, 0, 1);
        smooth.ps = THREE.MathUtils.damp(
          smooth.ps,
          PUPIL_RATIO * irisBase * eyes.pupil.scale * visible,
          EYE_LAMBDA,
          delta,
        );

        side.pupil.current.position.set(
          smooth.x + smooth.px,
          smooth.y + smooth.py,
          smooth.z + 0.008,
        );
        side.pupil.current.scale.set(
          Math.max(0.0001, smooth.ps),
          Math.max(0.0001, smooth.ps),
          1,
        );
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <pointLight position={[2.4, 2.2, 3]} intensity={2.1} color="#FFF4D8" />
      <pointLight position={[-2.4, -1.4, 1.6]} intensity={0.9} color="#8C7BFF" />

      <group ref={group}>
        <mesh ref={mesh}>
          <sphereGeometry args={[1, 48, 48]} />
          <MeshDistortMaterial
            color={look.edge}
            emissive={look.core}
            emissiveIntensity={look.emissive}
            distort={look.distort}
            speed={look.speed}
            roughness={0.28}
            metalness={0.06}
          />
        </mesh>

        {/* Eyes: flat discs that always face the camera, drawn over the sphere
            so a distortion bulge can never swallow them. */}
        <mesh ref={irisLeft} renderOrder={10} frustumCulled={false}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial
            color={IRIS_COLOUR}
            toneMapped={false}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={irisRight} renderOrder={10} frustumCulled={false}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial
            color={IRIS_COLOUR}
            toneMapped={false}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {!compact && (
          <>
            <mesh ref={pupilLeft} renderOrder={11} frustumCulled={false}>
              <circleGeometry args={[1, 24]} />
              <meshBasicMaterial
                color={PUPIL_COLOUR}
                toneMapped={false}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh ref={pupilRight} renderOrder={11} frustumCulled={false}>
              <circleGeometry args={[1, 24]} />
              <meshBasicMaterial
                color={PUPIL_COLOUR}
                toneMapped={false}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          </>
        )}
      </group>
    </>
  );
}

/**
 * Lazy-loaded WebGL orb. Renders a single modest sphere; the canvas pauses
 * completely while the tab is hidden and is disposed on unmount by R3F.
 */
export default function BrindleOrb3D({
  mood,
  thinking,
  pointerX,
  pointerY,
  eyeMode,
  compact,
  size,
}: SceneProps & { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const [visible, setVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );

  // The orb knows its own pixel size, so the renderer is configured from it
  // instead of R3F's measurement (which reports 0 for this fixed-size box).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const root = createRoot(canvas);
    rootRef.current = root;
    root.configure({
      size: { width: size, height: size, top: 0, left: 0 },
      dpr: [1, 1.5],
      frameloop: document.hidden ? "never" : "always",
      camera: { position: [0, 0, 3.25], fov: 40 },
      gl: { alpha: true, antialias: true, powerPreference: "low-power" },
    });

    root.render(
      <Scene
        mood={mood}
        thinking={thinking}
        pointerX={pointerX}
        pointerY={pointerY}
        eyeMode={eyeMode}
        compact={compact}
      />,
    );

    return () => {
      root.unmount();
      rootRef.current = null;
    };
    // Scene props are pushed through the render effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  useEffect(() => {
    rootRef.current?.render(
      <Scene
        mood={mood}
        thinking={thinking}
        pointerX={pointerX}
        pointerY={pointerY}
        eyeMode={eyeMode}
        compact={compact}
      />,
    );
  }, [mood, thinking, pointerX, pointerY, eyeMode, compact]);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Pause rendering entirely while the tab is in the background.
  useEffect(() => {
    rootRef.current?.configure({ frameloop: visible ? "always" : "never" });
  }, [visible]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ width: size, height: size }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
