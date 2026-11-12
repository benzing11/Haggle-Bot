"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { EASE_OUT } from "@/lib/motion";
import { usePointer, useReducedMotionPreference } from "@/lib/pointer";

const FADE = { duration: 0.15, ease: EASE_OUT };
/** Ring radius around the pointer when hovering a shelf card. */
const RING = 19;

type CursorContext = "pointer" | "haggle" | "native";

function readContext(target: Element | null): CursorContext {
  if (!target) return "pointer";
  if (target.closest("[data-cursor-native]")) return "native";
  if (target.closest('[data-cursor="haggle"]')) return "haggle";
  return "pointer";
}

/**
 * The custom cursor: a gold arrow whose tip sits exactly on the pointer, plus
 * the HAGGLE ring on shelf cards. Only the PayPal region falls back to the
 * native pointer.
 */
export function CoinCursor({ dealSignal }: { dealSignal?: string | null }) {
  const { tracking, px, py } = usePointer();
  const reduce = useReducedMotionPreference();

  const [context, setContextState] = useState<CursorContext>("pointer");
  const [visible, setVisible] = useState(false);

  const contextRef = useRef<CursorContext>("pointer");
  const targetElRef = useRef<Element | null>(null);
  const lastDealRef = useRef<string | null>(null);

  const pop = useMotionValue(1);

  useEffect(() => {
    if (!tracking) return;

    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    const apply = (kind: CursorContext, el: Element | null) => {
      contextRef.current = kind;
      targetElRef.current = el;
      setContextState((previous) => (previous === kind ? previous : kind));
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      show();
      const target = event.target instanceof Element ? event.target : null;
      apply(readContext(target), target?.closest("[data-cursor]") ?? null);
    };

    const onOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) hide();
    };

    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointermove", show, { passive: true });
    window.addEventListener("pointerdown", show, { passive: true });
    document.addEventListener("pointerleave", hide);
    document.addEventListener("pointerout", onOut);
    window.addEventListener("blur", hide);

    // A click can swap the page under a still pointer, so no pointerover fires
    // on whatever lands underneath. Watch the DOM instead of frame callbacks.
    const observer = new MutationObserver(() => {
      const tracked = targetElRef.current;
      if (tracked && !tracked.isConnected) apply("pointer", null);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointermove", show);
      window.removeEventListener("pointerdown", show);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", hide);
    };
  }, [tracking]);

  useEffect(() => {
    // The native cursor is only hidden once the custom one is actually drawn.
    if (!tracking || !visible) {
      delete document.documentElement.dataset.cursor;
      return;
    }
    document.documentElement.dataset.cursor = "custom";
    return () => {
      delete document.documentElement.dataset.cursor;
    };
  }, [tracking, visible]);

  useEffect(() => {
    if (!dealSignal) {
      lastDealRef.current = null;
      return;
    }
    if (lastDealRef.current === dealSignal) return;
    lastDealRef.current = dealSignal;
    if (reduce) return;
    animate(pop, [1, 1.16, 1], { duration: 0.36, ease: EASE_OUT });
  }, [dealSignal, pop, reduce]);

  if (!tracking) return null;

  /* ------------------------------------------------- reduced motion: dot */

  if (reduce) {
    return (
      <motion.div
        aria-hidden
        data-cursor-follower
        className="pointer-events-none fixed left-0 top-0 z-[120] h-1.5 w-1.5 rounded-full bg-gold"
        style={{ x: px, y: py, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: visible && context !== "native" ? 1 : 0 }}
        transition={FADE}
      />
    );
  }

  return (
    <motion.div
      aria-hidden
      data-cursor-follower
      className="pointer-events-none fixed left-0 top-0 z-[120] h-0 w-0"
      style={{ x: px, y: py, scale: pop }}
      animate={{ opacity: visible && context !== "native" ? 1 : 0 }}
      transition={FADE}
    >
      {/* The arrow's tip is the element's origin, so it lands on the pointer. */}
      <motion.div
        className="absolute left-0 top-0 origin-top-left"
        animate={{ opacity: context === "haggle" ? 0 : 1, scale: context === "haggle" ? 0.9 : 1 }}
        transition={FADE}
      >
        <Arrow />
      </motion.div>

      {/* The only context ring: shelf cards that start a haggle. */}
      <motion.div
        className="absolute grid place-items-center rounded-full border border-gold/45 bg-gold/10"
        style={{ left: -RING, top: -RING, width: RING * 2, height: RING * 2 }}
        animate={{ opacity: context === "haggle" ? 1 : 0, scale: context === "haggle" ? 1 : 0.86 }}
        transition={FADE}
      >
        <span className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-gold">
          Haggle
        </span>
      </motion.div>
    </motion.div>
  );
}

/** Original gold arrow: no external assets, drawn in code. */
function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[22px] w-[22px] overflow-visible"
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))" }}
      aria-hidden
    >
      <path
        d="M0.8 0.8 L0.8 19.6 L5.6 14.9 L8.5 21.8 L11.9 20.3 L9.1 13.6 L15.6 13.1 Z"
        fill="#F5B94A"
        stroke="#1C1206"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M2.6 3.2 L2.6 15.4 L5.2 12.9"
        fill="none"
        stroke="#FFF3D0"
        strokeOpacity="0.85"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The ambient gold pool that trails the pointer behind the page content. */
export function CursorGlow() {
  const { enabled, x, y } = usePointer();
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  useEffect(() => {
    if (!enabled) return;
    const stopX = x.on("change", (value) => glowX.set(value * 140));
    const stopY = y.on("change", (value) => glowY.set(value * 110));
    return () => {
      stopX();
      stopY();
    };
  }, [enabled, glowX, glowY, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[46rem] w-[46rem] rounded-full will-change-transform"
      style={{
        x: glowX,
        y: glowY,
        translateX: "-50%",
        translateY: "-50%",
        marginLeft: "50vw",
        marginTop: "50vh",
        background:
          "radial-gradient(circle, rgba(245,185,74,0.13), rgba(245,185,74,0.05) 42%, transparent 68%)",
      }}
    />
  );
}
