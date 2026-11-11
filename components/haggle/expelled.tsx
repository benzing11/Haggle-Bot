"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, RefreshCw } from "lucide-react";

import type { Product } from "@/lib/types";

import { BrindleOrb } from "./brindle-orb";

export function ExpelledView({
  product,
  lastLine,
  onRetry,
  onShelf,
}: {
  product: Product;
  lastLine: string;
  onRetry: () => void;
  onShelf: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#040406]/80 p-4 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="expelled-title"
    >
      <motion.div
        animate={reduce ? undefined : { x: [0, -9, 9, -6, 4, 0] }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b0b10]/95 p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.65)] sm:p-8"
      >
        <div className="mx-auto">
          <BrindleOrb mood="defeated" size={84} />
        </div>

        <div className="mt-6 font-mono text-[9px] uppercase tracking-[0.26em] text-danger/80">
          the shop has closed
        </div>
        <h2 id="expelled-title" className="mt-2 font-display text-[28px] leading-tight text-ink">
          Brindle has ended the haggle.
        </h2>

        <p className="mx-auto mt-3 max-w-[34ch] text-[13px] leading-relaxed text-ink-muted">
          {lastLine || "Patience is a finite resource, and you spent it."}
        </p>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted/60">
          {product.name} · still on the shelf
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold to-ember px-5 py-3 text-[13px] font-medium text-primary-foreground transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again, more politely
          </button>
          <button
            type="button"
            onClick={onShelf}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-[13px] text-ink-muted transition-colors hover:border-white/25 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to the shelf
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
