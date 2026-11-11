"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ShieldCheck, TimerReset, X } from "lucide-react";

import { usd } from "@/lib/format";
import type { Deal, Product } from "@/lib/types";
import NumberFlow from "@number-flow/react";

import dynamic from "next/dynamic";

const PayPalCheckout = dynamic(() => import("./paypal-checkout"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[52px] w-full place-items-center rounded-full border border-white/10 bg-white/[0.03]">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
        waking the till…
      </span>
    </div>
  ),
});

export type CaptureSummary = {
  orderId: string;
  captureId: string;
  amount: number;
  currency: string;
  payerName: string | null;
};

export function DealCard({
  deal,
  product,
  onPaid,
  onExpired,
  onCancel,
}: {
  deal: Deal;
  product: Product;
  onPaid: (capture: CaptureSummary) => void;
  onExpired: () => void;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, deal.expiresAt - Date.now()),
  );
  const expiredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    expiredRef.current = false;
    const tick = () => {
      const next = Math.max(0, deal.expiresAt - Date.now());
      setRemaining(next);
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpiredRef.current();
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [deal.expiresAt]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const fraction = Math.min(1, remaining / (10 * 60 * 1000));
  const circumference = 2 * Math.PI * 18;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#040406]/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-title"
    >
      <motion.div
        initial={reduce ? false : { y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-white/[0.1] bg-[#0b0b10]/95 shadow-[0_-20px_80px_rgba(0,0,0,0.6)] sm:rounded-2xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-60 blur-3xl"
          style={{ background: product.glow }}
        />

        <div className="relative flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold/90">
            terms agreed
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Back out of this deal"
            className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-ink-muted transition-colors hover:border-white/25 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative px-5 pb-5 pt-6 sm:px-6">
          <h2 id="deal-title" className="font-display text-[28px] leading-tight text-ink">
            A deal, then.
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted">{product.name}</p>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted/80">
                the agreed price
              </div>
              <div className="mt-1 font-mono text-[44px] leading-none text-ink">
                <NumberFlow
                  value={deal.price}
                  format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }}
                />
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-success">
                you saved {usd(product.listPrice - deal.price)} ·{" "}
                {Math.round(((product.listPrice - deal.price) / product.listPrice) * 100)}% off list
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="relative h-12 w-12">
                <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="2.5" />
                  <motion.circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke={totalSeconds <= 60 ? "#FF5C6C" : "#F5B94A"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: circumference * (1 - fraction) }}
                    transition={{ duration: 0.9, ease: "linear" }}
                  />
                </svg>
                <TimerReset className="absolute inset-0 m-auto h-4 w-4 text-ink-muted" />
              </div>
              <span
                className="font-mono text-[12px] tabular-nums"
                style={{ color: totalSeconds <= 60 ? "#FF5C6C" : "#F4F1EA" }}
              >
                {minutes}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="mt-5 border-y border-dashed border-white/[0.09] py-4">
            <PayPalCheckout dealToken={deal.token} price={deal.price} onPaid={onPaid} />
            <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-muted/80">
              <ShieldCheck className="h-3 w-3" />
              PayPal sandbox · amount signed server-side
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-muted/80">
            This contract expires in ten minutes. Brindle has already spent the money
            in his head.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DealOverlay(props: {
  deal: Deal;
  product: Product;
  onPaid: (capture: CaptureSummary) => void;
  onExpired: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      <DealCard {...props} />
    </AnimatePresence>
  );
}
