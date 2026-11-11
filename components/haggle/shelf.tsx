"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { MouseEvent } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { BorderBeam } from "@/components/ui/border-beam";
import { MagicCard } from "@/components/ui/magic-card";
import { usd } from "@/lib/format";
import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/lib/types";

import { ProductArt } from "./product-art";

export function Shelf({ onSelect }: { onSelect: (product: Product) => void }) {
  const reduce = useReducedMotion();

  return (
    <div className="pb-8">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative pt-6 sm:pt-12"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-muted">
          <Sparkles className="h-3 w-3 text-gold" />
          The Unreasonable Goods Co.
        </div>

        <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(2.9rem,8vw,5.6rem)] leading-[0.92] tracking-[-0.02em] text-ink">
          Nothing here has a price.
          <span className="mt-1 block italic gold-text">Yet.</span>
        </h1>

        <div className="mt-6 flex max-w-xl flex-col gap-4 sm:mt-8">
          <p className="text-[15px] leading-relaxed text-ink-muted sm:text-base">
            Pick an object. Brindle — the shopkeeper — has a secret floor and a
            finite amount of patience. Talk him down, then pay exactly what you
            both agree on with PayPal.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted/70">
            Sandbox payments · No real money moves · Every price is a conversation
          </p>
        </div>
      </motion.section>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PRODUCTS.map((product, index) => (
          <ShelfCard
            key={product.id}
            product={product}
            index={index}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.06] pt-5 text-[12px] text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gold" />
          Brindle has a floor. He will not tell you where it is.
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-danger" />
          Lowballs cost patience. Charm buys a little room.
        </span>
      </div>
    </div>
  );
}

function ShelfCard({
  product,
  index,
  onSelect,
}: {
  product: Product;
  index: number;
  onSelect: (product: Product) => void;
}) {
  const reduce = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 260, damping: 26 });
  const springY = useSpring(rotateY, { stiffness: 260, damping: 26 });

  function onMove(event: MouseEvent<HTMLButtonElement>) {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 9);
    rotateX.set(-py * 9);
  }

  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.button
      type="button"
      onClick={() => {
        rotateX.set(0);
        rotateY.set(0);
        onSelect(product);
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.08 + index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        rotateX: reduce ? 0 : springX,
        rotateY: reduce ? 0 : springY,
        transformPerspective: 900,
      }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      className="group relative rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <MagicCard
        className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-md transition-colors duration-300 group-hover:border-white/[0.16]"
        glow="rgba(245, 185, 74, 0.14)"
      >
        <BorderBeam className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative flex items-center justify-center px-6 pt-6">
          <div
            className="pointer-events-none absolute inset-x-8 top-8 h-28 rounded-full blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: product.glow }}
          />
          <motion.div
            layoutId={`art-${product.id}`}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
            className="relative mx-auto h-40 w-full max-w-[210px]"
          >
            <ProductArt id={product.id} />
          </motion.div>
        </div>

        <div className="mt-auto flex flex-col gap-2 p-5">
          <h2 className="font-display text-[21px] leading-tight text-ink">
            {product.name}
          </h2>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            {product.tagline}
          </p>

          <div className="mt-3 flex items-end justify-between border-t border-white/[0.07] pt-3">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted/70">
                starting at
              </div>
              <div className="font-mono text-lg text-ink">{usd(product.listPrice)}</div>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-gold opacity-80 transition-opacity group-hover:opacity-100">
              Haggle
              <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </MagicCard>
    </motion.button>
  );
}
