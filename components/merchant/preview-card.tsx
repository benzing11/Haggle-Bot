"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { DURATION, EASE_OUT } from "@/lib/motion";

import type { PreviewState } from "./shop-form";

export function PreviewCard({ state }: { state: PreviewState }) {
  const reduce = useReducedMotion();

  return (
    <section className="surface rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[22px] leading-tight text-ink">
          Brindle&apos;s Opening Line
        </h2>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted/70">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-gold"
            animate={reduce ? { opacity: 0.8 } : { opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          Live Preview
        </span>
      </div>

      <div className="mt-4 min-h-[210px]">
        <AnimatePresence mode="wait" initial={false}>
          {state.status === "idle" && (
            <motion.div
              key="idle"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: DURATION.micro, ease: EASE_OUT }}
              className="grid min-h-[210px] place-items-center rounded-xl border border-dashed border-white/12 px-6 text-center"
            >
              <p className="max-w-[24ch] text-[12.5px] leading-relaxed text-ink-muted/80">
                Fill in your details and hit Save to hear Brindle&apos;s pitch.
              </p>
            </motion.div>
          )}

          {state.status === "loading" && (
            <motion.div
              key="loading"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: DURATION.micro, ease: EASE_OUT }}
              className="flex min-h-[210px] flex-col justify-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-5"
            >
              <span
                className="flex items-center gap-1.5"
                aria-label="Brindle is thinking"
              >
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="h-1.5 w-1.5 rounded-full bg-ink-muted"
                    animate={
                      reduce
                        ? { opacity: 0.6 }
                        : { opacity: [0.25, 1, 0.25], y: [0, -2, 0] }
                    }
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: dot * DURATION.stagger,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted/60">
                brindle is choosing his words
              </span>
            </motion.div>
          )}

          {state.status === "ready" && (
            <motion.div
              key="ready"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: DURATION.micro, ease: EASE_OUT }}
              className="flex min-h-[210px] flex-col justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-5"
            >
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/[0.08]"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-gold to-ember" />
                </span>
                <p className="text-[13.5px] leading-relaxed text-ink/90">
                  <Typewriter text={state.line} />
                </p>
              </div>

              <p className="text-[11px] leading-relaxed text-ink-muted/70">
                This is how Brindle will open every haggle for your listing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/** Same 14ms reveal as the chat transcript. */
function Typewriter({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setCount(index);
      if (index >= text.length) window.clearInterval(interval);
    }, 14);
    return () => window.clearInterval(interval);
  }, [text, reduce]);

  const visible = reduce ? text.length : count;

  return (
    <span className={visible < text.length ? "caret" : undefined}>
      {text.slice(0, visible)}
    </span>
  );
}

