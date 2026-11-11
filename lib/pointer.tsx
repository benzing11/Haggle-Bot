"use client";

import { motionValue, useMotionValue, useSpring, type MotionValue } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { SPRING_SOFT_OPTIONS } from "./motion";

type FrameListener = (clientX: number, clientY: number) => void;

export type PointerState = {
  /** Fine pointer only (touch devices are never tracked). */
  tracking: boolean;
  /** Tracking *and* motion allowed: false when reduced motion is requested. */
  enabled: boolean;
  /** Smoothed, normalised -1..1 across the viewport. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Raw client pixels for precise hit maths (tilts, magnets). */
  px: MotionValue<number>;
  py: MotionValue<number>;
  /** One callback per pointer frame, batched off rAF. */
  subscribe: (listener: FrameListener) => () => void;
};

/* ------------------------------------------------------------------ media */

function mediaStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    getSnapshot() {
      return window.matchMedia(query).matches;
    },
    getServerSnapshot() {
      return false;
    },
  };
}

const FINE_POINTER = mediaStore("(hover: hover) and (pointer: fine)");
const REDUCED_MOTION = mediaStore("(prefers-reduced-motion: reduce)");

export function useFinePointer(): boolean {
  return useSyncExternalStore(
    FINE_POINTER.subscribe,
    FINE_POINTER.getSnapshot,
    FINE_POINTER.getServerSnapshot,
  );
}

export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(
    REDUCED_MOTION.subscribe,
    REDUCED_MOTION.getSnapshot,
    REDUCED_MOTION.getServerSnapshot,
  );
}

/* ------------------------------------------------------------------ context */

const PointerContext = createContext<PointerState | null>(null);

/** Used by components rendered outside the provider (e.g. a one-off story). */
const IDLE_POINTER: PointerState = {
  tracking: false,
  enabled: false,
  x: motionValue(0),
  y: motionValue(0),
  px: motionValue(0),
  py: motionValue(0),
  subscribe: () => () => {},
};

export function usePointer(): PointerState {
  return useContext(PointerContext) ?? IDLE_POINTER;
}

export function PointerProvider({ children }: { children: ReactNode }) {
  const fine = useFinePointer();
  const reduce = useReducedMotionPreference();
  const enabled = fine && !reduce;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_SOFT_OPTIONS);
  const y = useSpring(rawY, SPRING_SOFT_OPTIONS);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const listeners = useRef(new Set<FrameListener>());

  const subscribe = useCallback((listener: FrameListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    // Track on every fine pointer, even with reduced motion: the cursor still
    // has to follow, it just does so without tilt or stretch.
    if (!fine) return;

    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const flush = () => {
      frame = 0;
      rawX.set((nextX / window.innerWidth) * 2 - 1);
      rawY.set((nextY / window.innerHeight) * 2 - 1);
      px.set(nextX);
      py.set(nextY);
      for (const listener of listeners.current) listener(nextX, nextY);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      // Paused while the tab is hidden: no springs, no listeners, no repaint.
      if (document.hidden) return;
      nextX = event.clientX;
      nextY = event.clientY;
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fine, px, py, rawX, rawY]);

  return (
    <PointerContext.Provider
      value={{ tracking: fine, enabled, x, y, px, py, subscribe }}
    >
      {children}
    </PointerContext.Provider>
  );
}
