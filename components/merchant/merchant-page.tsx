"use client";

import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { Ambient } from "@/components/haggle/ambient";
import { BrindleOrb } from "@/components/haggle/brindle-orb";
import { CoinCursor, CursorGlow } from "@/components/haggle/coin-cursor";
import { MuteToggle } from "@/components/haggle/mute-toggle";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  getMerchantServerSnapshot,
  getMerchantSnapshot,
  subscribeMerchant,
} from "@/lib/merchant";
import { DURATION } from "@/lib/motion";
import { PointerProvider } from "@/lib/pointer";
import { useSoundUnlock } from "@/lib/sound";

import { PreviewCard } from "./preview-card";
import { ShopForm, type PreviewState } from "./shop-form";

const noopSubscribe = () => () => {};

export function MerchantPage() {
  useSoundUnlock();

  const saved = useSyncExternalStore(
    subscribeMerchant,
    getMerchantSnapshot,
    getMerchantServerSnapshot,
  );

  // The form reads localStorage for its initial values, so it mounts only once
  // the browser is here. Same on server and client until then, no reflow.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const [preview, setPreview] = useState<PreviewState>({
    status: "idle",
    line: "",
  });

  return (
    <PointerProvider>
      <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden">
        <Ambient mood="amused" />
        <CursorGlow />
        <CoinCursor dealSignal={null} />

        <header className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-5 sm:px-6">
          <Link
            href="/"
            aria-label="Haggle Bot, back to the shelf"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <BrindleOrb mood="amused" size={26} breathe={false} />
            <span className="font-display text-[19px] tracking-wide text-ink">
              Haggle Bot
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Merchant
            </span>
            <MuteToggle />
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 sm:px-6">
          {/* 1 — breadcrumb ------------------------------------------------ */}
          <BlurFade delay={0} yOffset={6}>
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-gold/40 hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              Back to shop
            </Link>
          </BlurFade>

          {/* 2 — headline -------------------------------------------------- */}
          <BlurFade delay={DURATION.stagger} yOffset={10}>
            <div className="mt-5 max-w-2xl">
              <h1 className="font-display text-[clamp(2.3rem,6.4vw,3.7rem)] leading-[0.94] tracking-[-0.02em] text-ink">
                Your Shop.
                <span className="mt-1 block italic gold-text">
                  Brindle&apos;s Voice.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-muted sm:text-[15px]">
                Set your prices, pick a personality. Brindle haggles for you —
                never below your floor.
              </p>
            </div>
          </BlurFade>

          {/* 3 — form + 4 — preview ---------------------------------------- */}
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-5">
            <BlurFade delay={DURATION.stagger * 2} yOffset={12}>
              {mounted ? (
                <ShopForm initial={saved} onPreview={setPreview} />
              ) : (
                <FormSkeleton />
              )}
            </BlurFade>

            <BlurFade delay={DURATION.stagger * 3} yOffset={12}>
              <PreviewCard state={preview} />
            </BlurFade>
          </div>

          {/* footer -------------------------------------------------------- */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/[0.06] pt-5 text-[12px] text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-gold" />
              Your listing appears in the shop for this visit — it clears when
              you refresh.
            </span>
            <Link
              href="/"
              className="group inline-flex items-center gap-1 text-ink-muted transition-colors hover:text-gold"
            >
              Back to shop
              <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </main>
      </div>
    </PointerProvider>
  );
}

/** Same card, same rhythm, no fields yet: the swap costs zero layout shift. */
function FormSkeleton() {
  return (
    <section
      aria-busy
      className="surface rounded-2xl p-5 sm:p-6"
      style={{ minHeight: 605 }}
    >
      <div className="h-6 w-48 rounded bg-white/[0.05]" />
      <div className="mt-2 h-3 w-64 rounded bg-white/[0.03]" />
      <div className="mt-6 space-y-4">
        {[0, 1, 2].map((row) => (
          <div key={row}>
            <div className="h-2.5 w-24 rounded bg-white/[0.04]" />
            <div className="mt-2 h-11 rounded-xl border border-white/[0.05] bg-white/[0.02]" />
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-11 rounded-xl border border-white/[0.05] bg-white/[0.02]" />
          <div className="h-11 rounded-xl border border-white/[0.05] bg-white/[0.02]" />
        </div>
        <div className="h-12 rounded-xl bg-white/[0.05]" />
      </div>
    </section>
  );
}
