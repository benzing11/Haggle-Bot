"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { BorderBeam } from "@/components/ui/border-beam";
import { usd } from "@/lib/format";
import {
  getMerchantServerSnapshot,
  getMerchantSnapshot,
  merchantToProduct,
  subscribeMerchant,
} from "@/lib/merchant";
import { SPRING_UI_OPTIONS, T, staggerDelay } from "@/lib/motion";
import { usePointer } from "@/lib/pointer";
import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/lib/types";

import { Parallax } from "./parallax";
import { ProductArt } from "./product-art";

/** Maximum tilt in either axis. More than this stops feeling structural. */
const TILT = 6;

export function Shelf({ onSelect }: { onSelect: (product: Product) => void }) {
  const reduce = useReducedMotion();

  // A merchant listing saved in this browser joins the shelf as a fifth card.
  const merchant = useSyncExternalStore(
    subscribeMerchant,
    getMerchantSnapshot,
    getMerchantServerSnapshot,
  );
  const products: Product[] = merchant
    ? [...PRODUCTS, merchantToProduct(merchant)]
    : PRODUCTS;

  return (
    <div className="pb-8">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T.panel}
        className="relative pt-6 sm:pt-12"
      >
        <Parallax depth={4}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-muted">
            <Sparkles className="h-3 w-3 text-gold" />
            The Unreasonable Goods Co.
          </div>
        </Parallax>

        <Parallax depth={9}>
          <h1
            data-intro-rise
            className="mt-6 max-w-[16ch] font-display text-[clamp(2.9rem,8vw,5.6rem)] leading-[0.92] tracking-[-0.02em] text-ink"
          >
            Nothing here has a price.
            <span className="mt-1 block italic gold-text">Yet.</span>
          </h1>
        </Parallax>

        <Parallax depth={12}>
          <div data-intro-rise className="mt-6 flex max-w-xl flex-col gap-4 sm:mt-8">
            <p className="text-[15px] leading-relaxed text-ink-muted sm:text-base">
              Pick an object. Brindle — the shopkeeper — has a secret floor and a
              finite amount of patience. Talk him down, then pay exactly what you
              both agree on with PayPal.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted/70">
              Sandbox payments · No real money moves · Every price is a conversation
            </p>
          </div>
        </Parallax>
      </motion.section>

      <div
        className={`mt-12 grid gap-4 sm:grid-cols-2 ${merchant ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
      >
        {products.map((product, index) => (
          <ShelfCard
            key={product.id}
            product={product}
            index={index}
            badge={product.id === "merchant" ? "Your listing" : undefined}
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
        <Link
          href="/merchant"
          className="group ml-auto inline-flex items-center gap-1 text-ink-muted transition-colors hover:text-gold"
        >
          {merchant ? "Your listing is live — edit your shop" : "Are you a merchant? Set up your shop"}
          <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function ShelfCard({
  product,
  index,
  badge,
  onSelect,
}: {
  product: Product;
  index: number;
  badge?: string;
  onSelect: (product: Product) => void;
}) {
  const reduce = useReducedMotion();
  const { enabled, subscribe } = usePointer();
  const ref = useRef<HTMLButtonElement>(null);
  // A listing joins the grid after hydration. Its card is never allowed to
  // depend on an entrance animation to become visible: a paused frame (a
  // background tab, a slow device) would otherwise leave an invisible card.
  const late = product.id === "merchant";
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, SPRING_UI_OPTIONS);
  const springY = useSpring(rotateY, SPRING_UI_OPTIONS);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!enabled) {
      rotateX.set(0);
      rotateY.set(0);
      return;
    }

    // Cached rect: measured on enter and on resize, never inside the frame.
    let rect = element.getBoundingClientRect();
    const measure = () => {
      rect = element.getBoundingClientRect();
    };

    const onEnter = () => {
      measure();
      element.style.setProperty("--spot-o", "1");
    };

    const onLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
      element.style.setProperty("--spot-o", "0");
    };

    const unsubscribe = subscribe((clientX, clientY) => {
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
        return;
      }

      rotateY.set((localX / rect.width - 0.5) * TILT * 2);
      rotateX.set(-(localY / rect.height - 0.5) * TILT * 2);
      element.style.setProperty("--spot-x", `${localX}px`);
      element.style.setProperty("--spot-y", `${localY}px`);
    });

    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure);

    return () => {
      unsubscribe();
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      element.style.removeProperty("--spot-o");
    };
  }, [enabled, rotateX, rotateY, subscribe]);

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => {
        rotateX.set(0);
        rotateY.set(0);
        onSelect(product);
      }}
      initial={reduce || late ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...T.panel, delay: late ? 0 : staggerDelay(index, 0.08) }}
      style={{
        rotateX: reduce ? 0 : springX,
        rotateY: reduce ? 0 : springY,
        transformPerspective: 900,
      }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      className="tilt-card group relative rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={
          late
            ? // The listing sits last, where the ambient glow has faded, so a
              // 3.5% fill over a dark backdrop reads as an empty slot. Its panel
              // carries its own weight instead of borrowing light from behind.
              "relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.14] bg-white/[0.07] transition-colors duration-300 group-hover:border-white/[0.22]"
            : "relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-md transition-colors duration-300 group-hover:border-white/[0.16]"
        }
      >
        <BorderBeam className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {badge && (
          <span className="absolute right-4 top-4 z-10 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-gold backdrop-blur-sm">
            {badge}
          </span>
        )}

        {/* Cursor spotlight: driven by CSS vars, never React state. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(340px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(245,185,74,0.11), transparent 72%)",
            opacity: "var(--spot-o, 0)",
            transition: "opacity var(--duration-micro) var(--ease-out-soft)",
          }}
        />

        {/* 1px border lit near the cursor. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            padding: "1px",
            background:
              "radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(245,185,74,0.7), rgba(245,185,74,0.12) 48%, transparent 74%)",
            opacity: "var(--spot-o, 0)",
            transition: "opacity var(--duration-micro) var(--ease-out-soft)",
            WebkitMaskImage:
              "linear-gradient(#000 0 0), linear-gradient(#000 0 0)",
            WebkitMaskClip: "content-box, border-box",
            WebkitMaskComposite: "xor",
            maskImage: "linear-gradient(#000 0 0), linear-gradient(#000 0 0)",
            maskClip: "content-box, border-box",
            maskComposite: "exclude",
          }}
        />

        <div className="relative flex items-center justify-center px-6 pt-6">
          <div
            className="pointer-events-none absolute inset-x-8 top-8 h-28 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: product.glow }}
          />
          <motion.div
            layoutId={`art-${product.id}`}
            transition={T.ui}
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
      </div>
    </motion.button>
  );
}
