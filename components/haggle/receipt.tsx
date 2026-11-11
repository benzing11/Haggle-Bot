"use client";

import NumberFlow from "@number-flow/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { shortId, usd } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export function ReceiptView({
  receipt,
  onShelf,
  onAgain,
}: {
  receipt: Receipt;
  onShelf: () => void;
  onAgain: () => void;
}) {
  const reduce = useReducedMotion();
  const [amount, setAmount] = useState(0);
  const [saved, setSaved] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAmount(receipt.amount);
      setSaved(Math.max(0, receipt.listPrice - receipt.amount));
    }, 260);
    return () => window.clearTimeout(timer);
  }, [receipt]);

  const percentSaved =
    receipt.listPrice > 0
      ? Math.round((saved / receipt.listPrice) * 100)
      : 0;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-xl py-10"
    >
      <div className="mb-6 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-success/80">
          payment captured
        </span>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3rem)] leading-tight text-ink">
          A pleasure doing business.
        </h1>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.11] bg-[#0b0b10]/90 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-20 h-40 opacity-40 blur-3xl"
          style={{ background: "rgba(61,220,151,0.5)" }}
        />

        <div className="relative px-6 pb-6 pt-7 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-ink-muted/80">
                Haggle Bot · receipt
              </div>
              <div className="mt-1 font-display text-2xl text-ink">{receipt.productName}</div>
            </div>

            <motion.div
              initial={reduce ? false : { scale: 1.7, rotate: -22, opacity: 0 }}
              animate={{ scale: 1, rotate: -8, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.35 }}
              className="stamp-ink shrink-0 rounded-md px-3 py-1.5 font-mono text-[13px] uppercase tracking-[0.24em]"
            >
              paid
            </motion.div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted/80">
                charged
              </div>
              <div className="mt-1 font-mono text-[46px] leading-none text-ink">
                <NumberFlow
                  value={amount}
                  format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted/80">
                you saved
              </div>
              <div className="font-mono text-xl text-success">
                <NumberFlow
                  value={saved}
                  format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }}
                />
                <span className="ml-1.5 text-[12px] text-success/70">({percentSaved}%)</span>
              </div>
            </div>
          </div>

          <div className="my-6 border-t border-dashed border-white/[0.12]" />

          <dl className="space-y-2.5 font-mono text-[11.5px]">
            <Row label="list price" value={usd(receipt.listPrice)} />
            <Row label="agreed price" value={usd(receipt.amount)} strong />
            <Row label="order" value={shortId(receipt.orderId)} />
            <Row label="capture" value={shortId(receipt.captureId) || "—"} />
            <Row label="paid with" value={receipt.payerName ?? "PayPal sandbox buyer"} />
            <Row
              label="paid at"
              value={new Date(receipt.paidAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            />
          </dl>

          <p className="mt-6 text-center font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-muted/70">
            sandbox transaction · no real money moved
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold to-ember px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Haggle for the same thing
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
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="uppercase tracking-[0.16em] text-ink-muted/70">{label}</dt>
      <dd className={strong ? "text-ink" : "text-ink-muted"}>{value}</dd>
    </div>
  );
}
