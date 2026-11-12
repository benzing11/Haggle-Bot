"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Info } from "lucide-react";

import { usd } from "@/lib/format";
import type { Language } from "@/lib/language";
import { T } from "@/lib/motion";
import type { ChatMessage, Deal, NegotiationStats, Product } from "@/lib/types";

import { BrindleOrb, MOOD_LABEL } from "./brindle-orb";
import { Chat } from "./chat";
import { OfferComposer } from "./offer-composer";
import { PriceRail } from "./price-rail";
import { ProductArt } from "./product-art";

export function Room({
  product,
  messages,
  stats,
  busy,
  deal,
  disabled,
  language,
  onSubmit,
  onBack,
}: {
  product: Product;
  messages: ChatMessage[];
  stats: NegotiationStats;
  busy: boolean;
  deal: Deal | null;
  disabled?: boolean;
  language: Language;
  onSubmit: (offer: number, note: string, textOnly: boolean) => void;
  onBack: () => void;
}) {
  const reduce = useReducedMotion();
  const locked = deal !== null;
  const counter = locked ? deal.price : stats.counter;
  const buyerBest = locked ? deal.price : stats.buyerBest;

  const patienceTone =
    stats.patience > 60 ? "#F5B94A" : stats.patience > 30 ? "#FF9A5C" : "#FF5C6C";

  return (
    <div className="grid grid-cols-1 gap-5 pb-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.2fr)_minmax(235px,0.68fr)] lg:items-stretch">
      {/* Product ------------------------------------------------------------ */}
      <section className="order-1 flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" />
            shelf
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted/60">
            lot {product.id.slice(0, 3).toUpperCase()}
          </span>
        </div>

        <div className="relative mt-4 flex flex-1 items-center justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-12 h-32 rounded-full blur-3xl"
            style={{ background: product.glow }}
          />
          <motion.div
            layoutId={`art-${product.id}`}
            className="relative w-full max-w-[300px]"
            transition={T.ui}
          >
            <div className={reduce ? undefined : "animate-soft-float"}>
              <ProductArt id={product.id} />
            </div>
          </motion.div>
        </div>

        <div className="mt-4">
          <h2 className="font-display text-[26px] leading-tight text-ink">{product.name}</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{product.blurb}</p>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted/70">
              starting at
            </span>
            <span className="font-mono text-[15px] text-ink">{usd(product.listPrice)}</span>
          </div>

          <ul className="mt-3 space-y-1.5">
            {product.specs.map((spec) => (
              <li key={spec} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-muted/85">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                {spec}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Rail + mood -------------------------------------------------------- */}
      <aside className="order-2 flex flex-col gap-4 lg:order-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted/80">
              price rail
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted/60">
              <Info className="h-2.5 w-2.5" /> floor hidden
            </span>
          </div>

          <div className="mt-3 hidden lg:block">
            <PriceRail
              listPrice={product.listPrice}
              counter={counter}
              buyerBest={buyerBest}
              locked={locked}
            />
          </div>
          <div className="mt-3 lg:hidden">
            <PriceRail
              orientation="horizontal"
              listPrice={product.listPrice}
              counter={counter}
              buyerBest={buyerBest}
              locked={locked}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-3 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> you
            </div>
            <div className="flex items-center gap-1.5 text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" /> brindle
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted/80">
              patience
            </span>
            <span className="font-mono text-[10px]" style={{ color: patienceTone }}>
              {Math.round(stats.patience)}%
            </span>
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              className="h-full w-full origin-left rounded-full"
              style={{ backgroundColor: patienceTone }}
              animate={{ scaleX: Math.max(0, Math.min(1, stats.patience / 100)) }}
              transition={reduce ? { duration: 0 } : T.ui}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <BrindleOrb mood={stats.mood} size={40} breathe={false} thinking={busy} />
            <div className="min-w-0">
              <div className="text-[12px] text-ink">Brindle is {MOOD_LABEL[stats.mood]}</div>
              <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-muted/70">
                round {Math.min(stats.round, stats.maxRounds)} of {stats.maxRounds}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: stats.maxRounds }).map((_, index) => (
              <motion.span
                key={index}
                className="h-1 flex-1 rounded-full"
                animate={{
                  backgroundColor:
                    index < stats.round
                      ? index >= stats.maxRounds - 2
                        ? "#FF5C6C"
                        : "#F5B94A"
                      : "rgba(255,255,255,0.10)",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Chat --------------------------------------------------------------- */}
      <section className="order-3 flex min-h-[460px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md lg:order-2 lg:h-[min(74vh,660px)]">
        <header className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <BrindleOrb mood={stats.mood} size={30} breathe={false} thinking={busy} />
            <div>
              <div className="text-[13px] font-medium text-ink">Brindle</div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted/70">
                <span className="h-1 w-1 rounded-full bg-success" />
                {busy ? "considering…" : "shopkeeper"}
              </div>
            </div>
          </div>
          <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted/70">
            {Math.min(stats.round, stats.maxRounds)}/{stats.maxRounds}
          </span>
        </header>

        <Chat
          messages={messages}
          busy={busy}
          mood={stats.mood}
          language={language}
        />

        <OfferComposer
          listPrice={product.listPrice}
          busy={busy}
          disabled={disabled || locked || stats.expelled}
          language={language}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  );
}
