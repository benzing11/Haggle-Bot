"use client";

import { MeshDistortMaterial } from "@react-three/drei";
import { createRoot, extend, useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { MOOD_LOOK } from "@/lib/mood";
import type { Mood } from "@/lib/types";

type SceneProps = {
  mood: Mood;
  thinking: boolean;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
};

type DistortMaterial = THREE.MeshStandardMaterial & {
  distort: number;
  speed: number;
};

/** ~600ms mood crossfade: colours, distortion and speed all ease together. */
const MOOD_LAMBDA = 6;
const LEAN_LAMBDA = 4;

// createRoot bypasses <Canvas>'s internal extend(THREE); register what the orb uses.
extend({
  AmbientLight: THREE.AmbientLight,
  PointLight: THREE.PointLight,
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  SphereGeometry: THREE.SphereGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
});

function Scene({ mood, thinking, pointerX, pointerY }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const eyeLeft = useRef<THREE.Mesh>(null);
  const eyeRight = useRef<THREE.Mesh>(null);
  const squash = useRef(1);
  const time = useRef(0);

  const look = MOOD_LOOK[mood];

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

    const eyeOffsetX = px * 0.09;
    const eyeOffsetY = -py * 0.07;

    if (eyeLeft.current) {
      eyeLeft.current.position.x = -0.3 + eyeOffsetX;
      eyeLeft.current.position.y = 0.12 + eyeOffsetY;
    }
    if (eyeRight.current) {
      eyeRight.current.position.x = 0.3 + eyeOffsetX;
      eyeRight.current.position.y = 0.12 + eyeOffsetY;
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

        <mesh ref={eyeLeft} position={[-0.3, 0.12, 0.87]}>
          <sphereGeometry args={[0.082, 16, 16]} />
          <meshStandardMaterial color="#15110A" roughness={0.9} />
        </mesh>
        <mesh ref={eyeRight} position={[0.3, 0.12, 0.87]}>
          <sphereGeometry args={[0.082, 16, 16]} />
          <meshStandardMaterial color="#15110A" roughness={0.9} />
        </mesh>
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
      />,
    );
  }, [mood, thinking, pointerX, pointerY]);

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
