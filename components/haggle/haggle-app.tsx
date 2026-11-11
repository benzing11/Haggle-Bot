"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { celebrate } from "@/lib/celebrate";
import { sound, useSoundUnlock } from "@/lib/sound";
import type {
  ChatMessage,
  Deal,
  Mood,
  NegotiationStats,
  Phase,
  Product,
  Receipt,
} from "@/lib/types";

import { Ambient } from "./ambient";
import { BrindleOrb } from "./brindle-orb";
import { DealCard, type CaptureSummary } from "./deal-card";
import { ExpelledView } from "./expelled";
import { MuteToggle } from "./mute-toggle";
import { ReceiptView } from "./receipt";
import { Room } from "./room";
import { Shelf } from "./shelf";

const START_STATS: NegotiationStats = {
  patience: 100,
  round: 0,
  maxRounds: 8,
  mood: "amused",
  counter: null,
  buyerBest: null,
  expelled: false,
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function openingMessage(product: Product): ChatMessage {
  return {
    id: newId(),
    role: "brindle",
    text: product.opening,
    mood: "amused",
    kind: "message",
  };
}

export function HaggleApp() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("SHELF");
  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<NegotiationStats>(START_STATS);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);

  useSoundUnlock();

  const startHaggle = useCallback((next: Product) => {
    setProduct(next);
    setMessages([openingMessage(next)]);
    setStats(START_STATS);
    setDeal(null);
    setReceipt(null);
    setBusy(false);
    setPhase("ROOM");
    sound.play("pop");
  }, []);

  const backToShelf = useCallback(() => {
    setPhase("SHELF");
    setDeal(null);
    setBusy(false);
    sound.play("tick");
  }, []);

  async function submitOffer(offer: number, note: string) {
    if (!product || busy) return;

    const buyerMessage: ChatMessage = {
      id: newId(),
      role: "buyer",
      text: note,
      offer,
      kind: "message",
    };

    // The transcript the server audits. System cards never enter it.
    const history = messages
      .filter((message) => message.kind === "message")
      .map((message) =>
        message.role === "buyer"
          ? { role: "buyer" as const, text: message.text, offer: message.offer ?? null }
          : { role: "brindle" as const, text: message.text, counter: message.counter ?? null },
      );

    setMessages((previous) => [...previous, buyerMessage]);
    setBusy(true);

    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          message: note,
          offer,
          history,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        reply?: string;
        mood?: Mood;
        counter?: number | null;
        deal?: boolean;
        price?: number | null;
        dealToken?: string | null;
        expiresAt?: number | null;
        patience?: number;
        round?: number;
        maxRounds?: number;
        buyerBest?: number | null;
        expelled?: boolean;
      };

      if (response.status === 429) {
        toast.error("Brindle needs a moment. Try again in a second.");
        return;
      }

      if (response.status === 503 && data.error === "model_unconfigured") {
        toast.error(
          "Brindle has no brain yet — add GROQ_API_KEY (or ANTHROPIC_API_KEY) to .env.local.",
        );
        setMessages((previous) => [
          ...previous,
          {
            id: newId(),
            role: "brindle",
            text:
              data.reply ??
              "My abacus jammed. Nobody has plugged in my brain. Try again once they do.",
            mood: "skeptical",
            kind: "message",
          },
        ]);
        return;
      }

      if (!response.ok) {
        toast.error("Brindle's abacus jammed. Try that again.");
        if (data.reply) {
          setMessages((previous) => [
            ...previous,
            {
              id: newId(),
              role: "brindle",
              text: data.reply ?? "Say that again, slowly.",
              mood: data.mood ?? "skeptical",
              kind: "message",
            },
          ]);
        }
        return;
      }

      const reply = data.reply ?? "…";
      const mood = data.mood ?? "amused";
      const counter = data.counter ?? null;
      const expelled = Boolean(data.expelled);

      setMessages((previous) => [
        ...previous,
        {
          id: newId(),
          role: "brindle",
          text: reply,
          mood,
          counter,
          kind: "message",
        },
      ]);

      setStats({
        patience: data.patience ?? 100,
        round: data.round ?? 0,
        maxRounds: data.maxRounds ?? 8,
        mood,
        counter,
        buyerBest: data.buyerBest ?? null,
        expelled,
      });

      if (expelled) {
        setPhase("EXPELLED");
        sound.play("thud");
        return;
      }

      if (data.deal && data.dealToken && typeof data.price === "number") {
        const nextDeal: Deal = {
          token: data.dealToken,
          price: data.price,
          expiresAt: data.expiresAt ?? Date.now() + 10 * 60 * 1000,
        };

        setDeal(nextDeal);
        setStats((previous) => ({
          ...previous,
          counter: nextDeal.price,
          buyerBest: nextDeal.price,
          mood: "delighted",
        }));
        setMessages((previous) => [
          ...previous,
          {
            id: newId(),
            role: "brindle",
            text: "Shake on it.",
            offer: nextDeal.price,
            kind: "deal",
          },
        ]);

        sound.play("deal");
        void celebrate("deal");

        window.setTimeout(() => {
          // Only advance if the buyer is still in the room with this deal.
          setPhase((current) => (current === "ROOM" ? "DEAL" : current));
        }, 900);
      }
    } catch {
      toast.error("The shop's line went dead. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function handlePaid(capture: CaptureSummary) {
    if (!product) return;

    setReceipt({
      orderId: capture.orderId,
      captureId: capture.captureId,
      amount: capture.amount,
      currency: capture.currency,
      payerName: capture.payerName,
      productName: product.name,
      listPrice: product.listPrice,
      paidAt: Date.now(),
    });
    setDeal(null);
    setPhase("PAID");
    sound.play("chime");
    void celebrate("paid");
  }

  function handleExpired() {
    setDeal(null);
    setPhase("ROOM");
    setMessages((previous) => [
      ...previous,
      {
        id: newId(),
        role: "brindle",
        text: "Ten minutes is a lifetime in shopkeeping. The contract has dissolved — shall we try that number again?",
        mood: "skeptical",
        kind: "expired",
      },
    ]);
    toast.error("The deal expired. Brindle has reopened the haggle.");
    sound.play("thud");
  }

  function handleCancel() {
    setDeal(null);
    setPhase("ROOM");
    setMessages((previous) => [
      ...previous,
      {
        id: newId(),
        role: "brindle",
        text: "Backing out? Very well. The number stays on the table until it doesn't.",
        mood: "offended",
        kind: "expired",
      },
    ]);
    sound.play("thud");
  }

  const lastLine =
    [...messages].reverse().find((message) => message.role === "brindle")?.text ?? "";

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden">
      <Ambient />

      <header className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-5 sm:px-6">
        <button
          type="button"
          onClick={phase === "SHELF" ? undefined : backToShelf}
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          aria-label="Haggle Bot, back to the shelf"
        >
          <BrindleOrb mood="amused" size={26} breathe={false} />
          <span className="font-display text-[19px] tracking-wide text-ink">Haggle Bot</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            PayPal sandbox
          </span>
          <MuteToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 sm:px-6">
        <AnimatePresence initial={false}>
          {phase === "SHELF" && (
            <motion.div
              key="shelf"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Shelf onSelect={startHaggle} />
            </motion.div>
          )}

          {product && (phase === "ROOM" || phase === "DEAL" || phase === "EXPELLED") && (
            <motion.div
              key="room"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Room
                product={product}
                messages={messages}
                stats={stats}
                busy={busy}
                deal={deal}
                disabled={phase === "EXPELLED"}
                onSubmit={submitOffer}
                onBack={backToShelf}
              />
            </motion.div>
          )}

          {phase === "PAID" && receipt && (
            <motion.div
              key="paid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ReceiptView
                receipt={receipt}
                onShelf={backToShelf}
                onAgain={() => product && startHaggle(product)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {phase === "DEAL" && deal && product && (
          <DealCard
            key="deal"
            deal={deal}
            product={product}
            onPaid={handlePaid}
            onExpired={handleExpired}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "EXPELLED" && product && (
          <ExpelledView
            key="expelled"
            product={product}
            lastLine={lastLine}
            onRetry={() => startHaggle(product)}
            onShelf={backToShelf}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
