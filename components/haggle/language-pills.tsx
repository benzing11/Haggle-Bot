"use client";

import { motion, useReducedMotion } from "motion/react";

import { LANGUAGES, type Language } from "@/lib/language";
import { cn } from "@/lib/utils";

/**
 * Haggle-room only. A compact pill per language with one shared indicator that
 * slides between selections.
 */
export function LanguagePills({
  value,
  onChange,
  className,
}: {
  value: Language;
  onChange: (language: Language) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      role="group"
      aria-label="Brindle's language"
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5",
        className,
      )}
    >
      {LANGUAGES.map((language) => {
        const active = language.code === value;
        return (
          <button
            key={language.code}
            type="button"
            onClick={() => onChange(language.code)}
            aria-pressed={active}
            title={language.name}
            data-cursor="button"
            className={cn(
              "focus-glow relative rounded-full px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
              active ? "text-gold" : "text-ink-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="language-pill"
                className="absolute inset-0 rounded-full border border-gold/35 bg-gold/[0.12]"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                }
              />
            )}
            <span className="relative flex items-center gap-1">
              <span aria-hidden className="hidden text-[10px] leading-none sm:inline">
                {language.flag}
              </span>
              {language.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
