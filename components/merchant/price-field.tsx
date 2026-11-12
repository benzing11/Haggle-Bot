"use client";

import { motion, useReducedMotion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { useId } from "react";

import { T } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

/**
 * A price input with the same feel as the offer composer: a mono digit field,
 * a $ prefix, no browser chrome, and steppers that tick.
 */
export function PriceField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  hint,
  step = 5,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  error?: string;
  hint?: string;
  step?: number;
  id?: string;
}) {
  const reduce = useReducedMotion();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  const numeric = Number.parseFloat(value);
  const current = Number.isFinite(numeric) ? numeric : 0;

  function nudge(direction: number) {
    const next = Math.max(0, Math.round((current + direction * step) * 100) / 100);
    onChange(next === 0 ? "" : String(next));
    sound.play("tick");
    sound.vibrate(4);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor={fieldId}
          className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-muted/80"
        >
          {label}
        </label>

        {hint && <Hint text={hint} />}
      </div>

      <div
        className={cn(
          "focus-glow flex items-center gap-1 rounded-xl border bg-white/[0.03] px-3 transition-colors",
          error ? "border-danger/70" : "border-white/[0.09] hover:border-white/[0.16]",
        )}
      >
        <span aria-hidden className="font-mono text-[15px] text-ink-muted">
          $
        </span>
        <input
          id={fieldId}
          value={value}
          onChange={(event) => {
            const next = event.target.value.replace(/[^0-9.]/g, "").slice(0, 9);
            onChange(next);
          }}
          onBlur={onBlur}
          inputMode="decimal"
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-11 min-w-0 flex-1 bg-transparent font-mono text-[16px] tracking-tight text-ink outline-none placeholder:text-ink-muted/40"
        />
        <div className="flex items-center gap-1">
          <StepButton label={`Decrease ${label}`} onClick={() => nudge(-1)}>
            <Minus className="h-3 w-3" />
          </StepButton>
          <StepButton label={`Increase ${label}`} onClick={() => nudge(1)}>
            <Plus className="h-3 w-3" />
          </StepButton>
        </div>
      </div>

      {/* Fixed slot: an error can never shift the form. */}
      <div className="mt-1 min-h-[15px]">
        {error && (
          <motion.p
            id={errorId}
            initial={reduce ? false : { opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={T.micro}
            className="text-[11px] leading-tight text-danger"
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
}

function StepButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={T.ui}
      className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-ink-muted transition-colors hover:border-gold/40 hover:text-gold"
    >
      {children}
    </motion.button>
  );
}

function Hint({ text }: { text: string }) {
  const reduce = useReducedMotion();

  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        role="note"
        aria-label={text}
        className="grid h-4 w-4 place-items-center rounded-full border border-white/15 font-mono text-[9px] leading-none text-ink-muted transition-colors group-hover:border-gold/50 group-hover:text-gold focus-visible:border-gold/50 focus-visible:text-gold"
      >
        i
      </span>
      <motion.span
        initial={false}
        className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 w-[210px] rounded-lg border border-white/10 bg-[#0c0c11] px-3 py-2 text-[11px] leading-relaxed text-ink-muted opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
        style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
      >
        {text}
        {!reduce && (
          <span
            aria-hidden
            className="absolute -bottom-1 right-2 h-2 w-2 rotate-45 border-b border-r border-white/10 bg-[#0c0c11]"
          />
        )}
      </motion.span>
    </span>
  );
}
