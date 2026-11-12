"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import {
  PERSONALITIES,
  personalityLabel,
  type PersonalityId,
} from "@/lib/merchant";
import { T } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

/**
 * A styled listbox, not a native select. Each option carries its description
 * inside the dropdown; the field itself shows only the chosen name.
 */
export function PersonalitySelect({
  value,
  onChange,
}: {
  value: PersonalityId;
  onChange: (value: PersonalityId) => void;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      PERSONALITIES.findIndex((personality) => personality.id === value),
    ),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: PersonalityId) {
    onChange(id);
    sound.play("tick");
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onButtonKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setActive(
          Math.max(
            0,
            PERSONALITIES.findIndex((personality) => personality.id === value),
          ),
        );
        setOpen(true);
      }
    }
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % PERSONALITIES.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(
        (index) => (index - 1 + PERSONALITIES.length) % PERSONALITIES.length,
      );
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(PERSONALITIES[active].id);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(PERSONALITIES.length - 1);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-cursor="button"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onButtonKeyDown}
        className="focus-glow flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-left transition-colors hover:border-white/[0.16]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13.5px] text-ink">
            {personalityLabel(value)}
          </span>
          <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-gold">
            voice
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={T.micro}
          className="shrink-0 text-ink-muted"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label="Brindle's personality"
            tabIndex={-1}
            initial={reduce ? false : { opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onListKeyDown}
            ref={(node) => node?.focus({ preventScroll: true })}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b10] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
          >
            {PERSONALITIES.map((personality, index) => {
              const selected = personality.id === value;
              const highlighted = index === active;

              return (
                <li key={personality.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(personality.id)}
                    className={cn(
                      "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                      highlighted ? "bg-white/[0.05]" : "bg-transparent",
                    )}
                  >
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
                      {selected && <Check className="h-3.5 w-3.5 text-gold" />}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-[13px]",
                          selected ? "text-gold" : "text-ink",
                        )}
                      >
                        {personality.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">
                        {personality.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
