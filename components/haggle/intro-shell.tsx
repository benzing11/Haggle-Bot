"use client";

import { gsap } from "gsap";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The first three seconds of the shop. A full-screen black veil hides the shelf
 * while the Haggle Bot mark pops in, breathes, and dissolves into the page.
 *
 * Everything here is presentational: the page underneath is rendered, readable
 * and inert until the veil lifts. The final hand-off is a state flip, so the
 * overlay unmounts and can never intercept a click, and the main content is
 * guaranteed to end at opacity 1 instead of whatever GSAP last wrote.
 */
export function IntroShell({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [finished, setFinished] = useState(false);
  const started = useRef(false);
  const done = useRef(false);

  useEffect(() => {
    // StrictMode mounts effects twice in development. The first pass is torn
    // down and the second rebuilds the same timeline from scratch.
    if (started.current) return;
    started.current = true;

    const content = contentRef.current;
    const overlay = overlayRef.current;
    const lockup = lockupRef.current;
    const circle = circleRef.current;
    const glow = glowRef.current;
    const text = textRef.current;

    if (!content || !overlay || !lockup || !circle || !glow || !text) return;

    const root = document.documentElement;
    root.classList.add("intro-active");
    window.scrollTo(0, 0);

    const finish = () => {
      done.current = true;
      root.classList.remove("intro-active");
      setFinished(true);
    };

    const mm = gsap.matchMedia();

    // Reduced motion: no veil, no timeline. Show the page instantly.
    mm.add("(prefers-reduced-motion: reduce)", () => {
      if (done.current) return;
      gsap.set(overlay, { display: "none" });
      finish();
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Once the intro has handed off, a later OS motion-preference flip must
      // never replay it over a live page. Keep the content visible instead.
      if (done.current) {
        gsap.set(content, { opacity: 1 });
        return;
      }

      const rise = content.querySelectorAll("[data-intro-rise]");

      // Re-assert the start pose instead of trusting whatever a previous run
      // (or a Fast Refresh) left behind.
      gsap.set(overlay, { opacity: 1, pointerEvents: "auto" });
      gsap.set(lockup, { opacity: 1, scale: 1 });
      gsap.set(circle, { scale: 0, opacity: 0 });
      gsap.set(glow, { opacity: 0 });
      gsap.set(text, { opacity: 0, y: 10, filter: "blur(8px)" });
      gsap.set(content, { opacity: 0 });
      gsap.set(rise, { opacity: 0, y: 20 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: finish,
      });

      tl
        // Phase 1 — the mark springs in.
        .to(
          circle,
          { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.6)" },
          0,
        )
        .to(glow, { opacity: 0.5, duration: 0.8 }, 0)
        // Phase 2 — the wordmark resolves out of blur, overlapping the pop.
        .to(text, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8 }, 0.4)
        // Phase 3 — a barely-there pulse while the lockup rests.
        .call(
          () => circle.classList.add("animate-intro-pulse"),
          undefined,
          1.2,
        )
        // Phase 4 — the lockup recedes.
        .to(
          lockup,
          { opacity: 0, scale: 0.95, duration: 0.5, ease: "power2.inOut" },
          1.8,
        )
        // Phases 5 + 6 — veil out, page in, in lockstep.
        .set(overlay, { pointerEvents: "none" }, 2.3)
        .to(content, { opacity: 1, duration: 0.7, ease: "power2.inOut" }, 2.3)
        .to(rise, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 2.3)
        .to(overlay, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, 2.3);

      return () => {
        tl.kill();
        circle.classList.remove("animate-intro-pulse");
      };
    });

    return () => {
      // kill() tears down listeners without reverting the hand-off styles.
      mm.kill();
      root.classList.remove("intro-active");
      started.current = false;
    };
  }, []);

  return (
    <>
      <div
        ref={contentRef}
        data-intro-content
        inert={!finished}
        style={{ opacity: finished ? 1 : 0 }}
      >
        {children}
      </div>

      {!finished && (
        <div
          ref={overlayRef}
          data-intro-overlay
          aria-hidden="true"
          className="fixed inset-0 z-[130] flex items-center justify-center bg-background"
        >
          <div ref={lockupRef} className="flex items-center gap-3.5 sm:gap-4">
            <div className="relative flex items-center justify-center">
              <div
                ref={glowRef}
                className="absolute inset-[-70%] rounded-full bg-gold/35 blur-2xl"
                style={{ opacity: 0 }}
              />
              <div
                ref={circleRef}
                className="relative h-9 w-9 rounded-full bg-gold shadow-[0_0_40px_rgba(245,185,74,0.35)] sm:h-10 sm:w-10"
                style={{ opacity: 0, transform: "scale(0)" }}
              />
            </div>
            <span
              ref={textRef}
              className="font-display text-[28px] leading-none tracking-tight text-ink sm:text-[34px]"
              style={{ opacity: 0, transform: "translateY(10px)", filter: "blur(8px)" }}
            >
              Haggle Bot
            </span>
          </div>
        </div>
      )}
    </>
  );
}
