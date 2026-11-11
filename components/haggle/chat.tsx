"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { usd } from "@/lib/format";
import type { ChatMessage, Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

import { BrindleOrb } from "./brindle-orb";

export function Chat({
  messages,
  busy,
  mood,
  className,
}: {
  messages: ChatMessage[];
  busy: boolean;
  mood: Mood;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({
      top: element.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [messages, busy, reduce]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div
        ref={scrollRef}
        className="chat-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
      >
        {messages.map((message) => (
          <MessageRow key={message.id} message={message} />
        ))}

        {busy && (
          <div className="flex items-end gap-2.5">
            <BrindleOrb mood={mood} size={26} breathe={false} />
            <div className="rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.045] px-3.5 py-3">
              <span className="flex items-center gap-1.5" aria-label="Brindle is thinking">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="h-1.5 w-1.5 rounded-full bg-ink-muted"
                    animate={
                      reduce ? { opacity: 0.6 } : { opacity: [0.25, 1, 0.25], y: [0, -2, 0] }
                    }
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: dot * 0.16,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const reduce = useReducedMotion();
  const isBuyer = message.role === "buyer";

  if (message.kind === "deal") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="mx-auto flex w-full max-w-[280px] flex-col items-center gap-1 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-center"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-gold/80">
          handshake
        </span>
        <span className="font-display text-xl text-ink">{usd(message.offer ?? 0)}</span>
        <span className="text-[11px] text-ink-muted">{message.text}</span>
      </motion.div>
    );
  }

  if (message.kind === "expired") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-1 rounded-xl border border-white/10 border-dashed px-4 py-3 text-center"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-ink-muted">
          contract void
        </span>
        <span className="text-[11px] text-ink-muted">{message.text}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex", isBuyer ? "justify-end" : "items-end gap-2.5")}
    >
      {!isBuyer && (
        <BrindleOrb mood={message.mood ?? "amused"} size={26} breathe={false} />
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5",
          isBuyer
            ? "rounded-br-md border border-gold/20 bg-gold/[0.07]"
            : "rounded-bl-md border border-white/[0.08] bg-white/[0.045]",
        )}
      >
        {message.text && (
          <p
            className={cn(
              "text-[13.5px] leading-relaxed",
              isBuyer ? "text-ink/90" : "text-ink/90",
            )}
          >
            {isBuyer ? message.text : <Typewriter text={message.text} />}
          </p>
        )}

        {(message.offer != null || message.counter != null) && (
          <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px]">
            {message.offer != null && (
              <span className="text-gold">you · {usd(message.offer)}</span>
            )}
            {message.counter != null && (
              <span className="text-ink-muted">brindle · {usd(message.counter)}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

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
