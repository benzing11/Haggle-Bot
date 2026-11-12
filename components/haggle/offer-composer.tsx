"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Magnetic } from "@/components/ui/magnetic";
import { usd } from "@/lib/format";
import { PLACEHOLDERS, type Language } from "@/lib/language";
import { DURATION, EASE_OUT, T } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

/** Four lines of the note, then it scrolls. 12.5px text, relaxed leading. */
const MAX_NOTE_HEIGHT = 96;
const HINT_INTERVAL_MS = 6000;

export function OfferComposer({
  listPrice,
  busy,
  disabled,
  language,
  onSubmit,
}: {
  listPrice: number;
  busy: boolean;
  disabled?: boolean;
  language: Language;
  onSubmit: (offer: number, note: string, textOnly: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState(() => String(Math.round(listPrice * 0.72)));
  const [note, setNote] = useState("");
  const [justSent, setJustSent] = useState(false);
  const [lastSent, setLastSent] = useState<number | null>(null);
  // The hint index carries the language it belongs to, so switching language
  // starts from the first hint without a cascading effect.
  const [hint, setHint] = useState<{ language: Language; index: number }>({
    language,
    index: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wantFocus = useRef(false);

  const value = useMemo(() => {
    const parsed = Number.parseFloat(draft);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [draft]);

  const fill = Math.min(100, Math.max(0, (value / listPrice) * 100));
  const valid = value >= 1 && value <= listPrice;
  const locked = busy || disabled || justSent;
  const empty = note.length === 0;
  const hints = PLACEHOLDERS[language];
  const hintIndex = hint.language === language ? hint.index % hints.length : 0;

  // Hints only cycle while the field is empty.
  useEffect(() => {
    if (!empty) return;
    const timer = window.setInterval(() => {
      setHint((current) => {
        const base = current.language === language ? current.index : 0;
        return { language, index: (base + 1) % hints.length };
      });
    }, HINT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [empty, hints.length, language]);

  // Auto-grow to four lines, then scroll.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, MAX_NOTE_HEIGHT)}px`;
  }, [note]);

  // Refocus once Brindle has answered (or the lock lifts).
  useEffect(() => {
    if (locked || !wantFocus.current) return;
    wantFocus.current = false;
    textareaRef.current?.focus();
  }, [locked]);

  function nudge(delta: number) {
    if (locked) return;
    const next = Math.min(listPrice, Math.max(1, Math.round((value || 0) + delta)));
    setDraft(String(next));
    sound.play("tick");
    sound.vibrate(5);
  }

  function submit() {
    if (locked) return;
    if (!valid) {
      toast.error(`Pick a number between $1 and ${usd(listPrice)}.`);
      return;
    }

    const trimmed = note.trim();
    const rounded = Math.round(value * 100) / 100;
    const unchanged = lastSent !== null && rounded === lastSent;
    // Same price, something to say: a conversation turn, not a new offer.
    const textOnly = unchanged && trimmed.length > 0;

    if (unchanged && !trimmed) {
      toast.error("Change the price or say something — Brindle needs one or the other.");
      return;
    }

    sound.play("pop");
    sound.vibrate(8);
    setJustSent(true);
    onSubmit(rounded, trimmed, textOnly);
    if (!textOnly) setLastSent(rounded);
    setNote("");
    wantFocus.current = true;
    window.setTimeout(() => setJustSent(false), 900);
  }

  const iconKey = justSent ? "done" : busy ? "busy" : "arrow";

  return (
    <div className="border-t border-white/[0.07] bg-[#0a0a0f]/60 px-4 pb-4 pt-3.5 backdrop-blur-xl sm:px-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="offer-amount"
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted/80"
          >
            your offer
          </label>

          {/* The digits you see are NumberFlow; the input on top is the real one. */}
          <div className="focus-glow mt-0.5 flex items-baseline gap-1 border-b border-white/10 pb-1">
            <span aria-hidden className="font-mono text-2xl text-ink-muted">
              $
            </span>
            <div className="relative min-w-0 flex-1">
              <div
                aria-hidden
                className="pointer-events-none truncate font-mono text-[34px] leading-none tracking-tight text-ink"
              >
                <NumberFlow
                  value={value}
                  format={{ maximumFractionDigits: 2, minimumFractionDigits: 0 }}
                />
              </div>
              <input
                id="offer-amount"
                value={draft}
                onChange={(event) => {
                  const next = event.target.value.replace(/[^0-9.]/g, "").slice(0, 8);
                  setDraft(next);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit();
                  }
                }}
                inputMode="decimal"
                aria-label="Your offer in US dollars"
                placeholder="0"
                disabled={locked}
                className="absolute inset-0 w-full bg-transparent font-mono text-[34px] leading-none tracking-tight text-transparent caret-gold outline-none placeholder:text-transparent disabled:opacity-60 selection:bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pb-1">
          <StepButton label="Decrease offer" onClick={() => nudge(-5)} disabled={locked}>
            <Minus className="h-3.5 w-3.5" />
          </StepButton>
          <StepButton label="Increase offer" onClick={() => nudge(5)} disabled={locked}>
            <Plus className="h-3.5 w-3.5" />
          </StepButton>

          <Magnetic radius={80} className="ml-1">
            <motion.button
              type="button"
              onClick={submit}
              disabled={locked}
              aria-label="Send offer"
              data-cursor="button"
              whileTap={reduce ? undefined : { scale: 0.96 }}
              transition={T.ui}
              className={cn(
                "focus-glow shimmer-hover relative grid h-11 w-11 place-items-center overflow-hidden rounded-full text-primary-foreground shadow-[0_0_24px_rgba(245,185,74,0.28)] transition-colors duration-200",
                "bg-gradient-to-br from-gold to-ember disabled:opacity-60",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={iconKey}
                  initial={reduce ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -5 }}
                  transition={{ duration: DURATION.micro, ease: EASE_OUT }}
                  className="grid place-items-center"
                >
                  {justSent ? (
                    <Check className="h-4.5 w-4.5" />
                  ) : busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4.5 w-4.5" />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </Magnetic>
        </div>
      </div>

      <input
        type="range"
        min={1}
        max={listPrice}
        step={1}
        value={Math.min(listPrice, Math.max(1, Math.round(value)))}
        onChange={(event) => {
          setDraft(event.target.value);
          sound.play("tick");
          sound.vibrate(5);
        }}
        disabled={locked}
        aria-label="Offer amount dial"
        className="dial-range mt-3"
        style={{ ["--dial-fill" as string]: `${fill}%` }}
      />

      <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-ink-muted">
        <span className="uppercase tracking-[0.16em]">dial it</span>
        <span className="flex items-center gap-1.5 text-ink">
          {usd(value)}
          <span className="text-ink-muted/70">of {usd(listPrice)}</span>
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div
          className={cn(
            "focus-glow relative min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 transition-colors",
            busy && !justSent && "pulse-once",
          )}
        >
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 240))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            disabled={locked}
            maxLength={240}
            aria-label="Message to Brindle"
            className="block max-h-[96px] min-h-[20px] w-full resize-none overflow-y-auto bg-transparent text-[12.5px] leading-relaxed text-ink outline-none disabled:opacity-60"
          />

          {empty && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-2 overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`${language}-${hintIndex}`}
                  initial={reduce ? false : { opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -3 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="block truncate text-[12.5px] leading-relaxed text-ink-muted/60"
                >
                  {hints[hintIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </div>

        <span className="hidden shrink-0 pb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted/60 sm:inline">
          enter to send
        </span>
      </div>
    </div>
  );
}

function StepButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      transition={T.ui}
      className="focus-glow grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-ink-muted transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
    >
      {children}
    </motion.button>
  );
}
