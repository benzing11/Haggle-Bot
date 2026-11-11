"use client";

import NumberFlow from "@number-flow/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { usd } from "@/lib/format";
import { EASE_OUT, SPRING_UI_OPTIONS } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MIN_FRACTION = 0.35;
/** Where the shaded "unknown floor" band ends, as a fraction of list. */
const ZONE_FRACTION = 0.7;

function useTrackSize(orientation: "vertical" | "horizontal") {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize(orientation === "vertical" ? rect.height : rect.width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [orientation]);

  return { ref, size };
}

type RailProps = {
  listPrice: number;
  counter: number | null;
  buyerBest: number | null;
  locked?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
};

export function PriceRail({
  listPrice,
  counter,
  buyerBest,
  locked = false,
  orientation = "vertical",
  className,
}: RailProps) {
  const min = listPrice * MIN_FRACTION;
  const { ref, size } = useTrackSize(orientation);
  const reduce = useReducedMotion();

  const fraction = (value: number) =>
    Math.min(1, Math.max(0, (Math.min(listPrice, Math.max(min, value)) - min) / (listPrice - min)));

  const buyerFraction = buyerBest === null ? null : fraction(buyerBest);
  const counterFraction = counter === null ? null : fraction(counter);
  const zoneFraction = (ZONE_FRACTION - MIN_FRACTION) / (1 - MIN_FRACTION);

  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, ...SPRING_UI_OPTIONS };

  if (orientation === "horizontal") {
    return (
      <div
        ref={ref}
        className={cn("relative h-[86px] w-full select-none", className)}
        role="img"
        aria-label={`Price rail. List price ${usd(listPrice)}. Your best offer ${
          buyerBest === null ? "none" : usd(buyerBest)
        }. Brindle's counter ${counter === null ? "none" : usd(counter)}.`}
      >
        <div className="absolute inset-x-0 top-[38px] h-px bg-white/12" />

        <div
          className="absolute left-0 top-[33px] h-[11px] overflow-hidden rounded-full border border-white/10"
          style={{
            width: `${zoneFraction * 100}%`,
            background:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 5px, rgba(255,255,255,0.02) 5px 10px)",
          }}
        >
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-[0.22em] text-ink-muted">
            floor ???
          </span>
        </div>

        <div className="absolute right-0 top-[24px] text-[10px] font-mono uppercase tracking-[0.16em] text-ink-muted">
          {usd(listPrice)}
        </div>

        {/* Collision shockwave: the two markers meet, the ring expands once. */}
        {locked && counterFraction !== null && !reduce && (
          <motion.span
            aria-hidden
            data-rail-shock
            className="pointer-events-none absolute top-[38px] h-14 w-14 rounded-full border border-gold/70"
            style={{ left: counterFraction * size }}
            initial={{ scale: 0.2, opacity: 0.9, x: "-50%", y: "-50%" }}
            animate={{ scale: 3.6, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          />
        )}

        {buyerFraction !== null && (
          <motion.div
            className="absolute left-0 top-[38px]"
            animate={{ x: buyerFraction * size }}
            transition={spring}
          >
            <div className="relative -translate-x-1/2">
              <div className="mx-auto h-3 w-3 rounded-full bg-gold shadow-[0_0_14px_rgba(245,185,74,0.65)]" />
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/30 bg-[#15120c] px-2 py-0.5 font-mono text-[11px] text-gold">
                <NumberFlow value={buyerBest ?? 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} />
              </div>
            </div>
          </motion.div>
        )}

        {counterFraction !== null && (
          <motion.div
            className="absolute left-0 top-[38px]"
            animate={{ x: counterFraction * size }}
            transition={spring}
          >
            <div className="relative -translate-x-1/2">
              <div className="mx-auto h-3 w-3 rounded-full border border-white/70 bg-[#F4F1EA] shadow-[0_0_14px_rgba(255,255,255,0.35)]" />
              <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#141419] px-2 py-0.5 font-mono text-[11px] text-ink">
                <NumberFlow value={counter ?? 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("relative h-[300px] w-full select-none", className)}
      role="img"
      aria-label={`Price rail. List price ${usd(listPrice)}. Your best offer ${
        buyerBest === null ? "none" : usd(buyerBest)
      }. Brindle's counter ${counter === null ? "none" : usd(counter)}.`}
    >
      <div className="absolute inset-y-0 left-[72px] w-px bg-white/12" />
      <div className="absolute left-[65px] top-0 h-px w-4 bg-white/20" />
      <span className="absolute left-0 top-[-4px] font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        list
      </span>
      <span className="absolute left-[86px] top-[-6px] font-mono text-[11px] text-ink-muted">
        {usd(listPrice)}
      </span>

      <div
        className="absolute bottom-0 left-[67px] w-[11px] overflow-hidden rounded-full border border-white/10"
        style={{
          height: `${zoneFraction * 100}%`,
          background:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.13) 0 6px, rgba(255,255,255,0.02) 6px 12px)",
        }}
      />
      <span className="absolute bottom-[38%] left-[86px] font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted/80">
        floor&nbsp;???
      </span>

      {locked && counterFraction !== null && !reduce && (
        <motion.span
          aria-hidden
          data-rail-shock
          className="pointer-events-none absolute left-[72px] h-16 w-16 rounded-full border border-gold/70"
          style={{ top: (1 - counterFraction) * size }}
          initial={{ scale: 0.2, opacity: 0.9, x: "-50%", y: "-50%" }}
          animate={{ scale: 3.2, opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        />
      )}

      {buyerFraction !== null && (
        <motion.div
          className="absolute left-0 top-0 h-0 w-full"
          animate={{ y: (1 - buyerFraction) * size }}
          transition={spring}
        >
          <div className="absolute left-[66px] top-0 flex -translate-y-1/2 items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-gold shadow-[0_0_16px_rgba(245,185,74,0.7)]" />
            <span className="whitespace-nowrap rounded-full border border-gold/30 bg-[#15120c]/95 px-2 py-0.5 font-mono text-[11px] text-gold">
              <NumberFlow value={buyerBest ?? 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} />
            </span>
          </div>
        </motion.div>
      )}

      {counterFraction !== null && (
        <motion.div
          className="absolute left-0 top-0 h-0 w-full"
          animate={{ y: (1 - counterFraction) * size }}
          transition={spring}
        >
          <div className="absolute left-[66px] top-0 flex -translate-y-1/2 items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full border border-white/70 bg-[#F4F1EA] shadow-[0_0_16px_rgba(255,255,255,0.35)]" />
            <span className="whitespace-nowrap rounded-full border border-white/15 bg-[#141419]/95 px-2 py-0.5 font-mono text-[11px] text-ink">
              <NumberFlow value={counter ?? 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} />
            </span>
          </div>
        </motion.div>
      )}

      {locked && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: "inset 0 0 40px rgba(245,185,74,0.16)",
          }}
        />
      )}
    </div>
  );
}
