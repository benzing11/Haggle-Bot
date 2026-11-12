"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";

import { usd } from "@/lib/format";
import {
  clearMerchantConfig,
  formatRelativeTime,
  parsePrice,
  personalityLabel,
  validateMerchantDraft,
  writeMerchantConfig,
  type MerchantConfig,
  type MerchantDraft,
  type MerchantErrors,
  type PersonalityId,
} from "@/lib/merchant";
import { T } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

import { PersonalitySelect } from "./personality-select";
import { PriceField } from "./price-field";

const FALLBACK_OPENING = "Ah, a fine item. Let's talk price.";

export type PreviewState = {
  status: "idle" | "loading" | "ready";
  line: string;
};

export function ShopForm({
  initial,
  onPreview,
}: {
  initial: MerchantConfig | null;
  onPreview: (state: PreviewState) => void;
}) {
  const reduce = useReducedMotion();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [listPrice, setListPrice] = useState(
    initial ? String(initial.listPrice) : "",
  );
  const [floorPrice, setFloorPrice] = useState(
    initial ? String(initial.floorPrice) : "",
  );
  const [personality, setPersonality] = useState<PersonalityId>(
    initial?.personality ?? "fair_trader",
  );

  const [errors, setErrors] = useState<MerchantErrors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(
    initial?.savedAt ?? null,
  );
  const [flash, setFlash] = useState<string | null>(null);

  const draft: MerchantDraft = {
    name,
    description,
    listPrice,
    floorPrice,
    personality,
  };

  function validateField(field: keyof MerchantErrors) {
    const next = validateMerchantDraft(draft);
    setErrors((previous) => ({
      ...previous,
      [field]: next[field],
    }));
  }

  async function save() {
    if (status === "saving") return;

    const found = validateMerchantDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = found.name ? "name" : found.listPrice ? "list" : "floor";
      document.getElementById(`merchant-${first}`)?.focus();
      sound.play("tick");
      return;
    }

    const list = parsePrice(listPrice);
    const floor = parsePrice(floorPrice);

    setStatus("saving");
    sound.play("pop");
    onPreview({ status: "loading", line: "" });

    let line = FALLBACK_OPENING;
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 6_500);

      const response = await fetch("/api/merchant/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          listPrice: list,
          personality,
        }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timer));

      const data = (await response.json().catch(() => ({}))) as {
        openingLine?: unknown;
      };
      if (typeof data.openingLine === "string" && data.openingLine.trim()) {
        line = data.openingLine.trim();
      }
    } catch {
      // Keep the fallback line: the preview is a nicety, not a failure state.
    }

    const config = writeMerchantConfig({
      name: name.trim(),
      description: description.trim(),
      listPrice: list,
      floorPrice: floor,
      personality,
    });

    setSavedAt(config.savedAt);
    onPreview({ status: "ready", line });
    setStatus("saved");
    sound.play("chime");
    window.setTimeout(() => setStatus("idle"), 1_800);
  }

  function clear() {
    clearMerchantConfig();
    setName("");
    setDescription("");
    setListPrice("");
    setFloorPrice("");
    setPersonality("fair_trader");
    setErrors({});
    setSavedAt(null);
    setStatus("idle");
    onPreview({ status: "idle", line: "" });
    setFlash("Listing cleared.");
    sound.play("thud");
    window.setTimeout(() => setFlash(null), 2_200);
  }

  const iconKey = status === "saved" ? "check" : status === "saving" ? "busy" : "idle";

  return (
    <section className="surface relative rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] leading-tight text-ink">
            Configure Your Shop
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
            Two numbers and a personality. Brindle handles the conversation.
          </p>
        </div>
        <span className="hidden shrink-0 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted/70 sm:inline-flex">
          listing
        </span>
      </div>

      <div className="mt-6 space-y-3.5">
        {/* Product name -------------------------------------------------- */}
        <div>
          <label
            htmlFor="merchant-name"
            className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-muted/80"
          >
            product name
          </label>
          <input
            id="merchant-name"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 80))}
            onBlur={() => validateField("name")}
            placeholder="e.g. The Unreasonably Good Lamp"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "merchant-name-error" : undefined}
            className={cn(
              "focus-glow h-11 w-full rounded-xl border bg-white/[0.03] px-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-muted/45",
              errors.name
                ? "border-danger/70"
                : "border-white/[0.09] hover:border-white/[0.16]",
            )}
          />
          <div className="mt-1 min-h-[15px]">
            {errors.name && (
              <motion.p
                id="merchant-name-error"
                initial={reduce ? false : { opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={T.micro}
                className="text-[11px] leading-tight text-danger"
              >
                {errors.name}
              </motion.p>
            )}
          </div>
        </div>

        {/* Description --------------------------------------------------- */}
        <div>
          <label
            htmlFor="merchant-description"
            className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-muted/80"
          >
            one-line description
          </label>
          <input
            id="merchant-description"
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, 200))}
            placeholder="One line your buyers will see"
            className="focus-glow h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-muted/45 hover:border-white/[0.16]"
          />
          <div className="mt-1 min-h-[15px]" />
        </div>

        {/* Prices -------------------------------------------------------- */}
        <div className="grid gap-3 sm:grid-cols-2">
          <PriceField
            id="merchant-list"
            label="list price"
            value={listPrice}
            onChange={(next) => {
              setListPrice(next);
              if (errors.listPrice) {
                setErrors((previous) => ({ ...previous, listPrice: undefined }));
              }
            }}
            onBlur={() => validateField("listPrice")}
            placeholder="120.00"
            error={errors.listPrice}
          />
          <PriceField
            id="merchant-floor"
            label="floor price"
            value={floorPrice}
            onChange={(next) => {
              setFloorPrice(next);
              if (errors.floorPrice) {
                setErrors((previous) => ({ ...previous, floorPrice: undefined }));
              }
            }}
            onBlur={() => validateField("floorPrice")}
            placeholder="75.00"
            error={errors.floorPrice}
            hint="Your secret. Buyers never see this. Brindle will never go below it."
          />
        </div>

        {/* Personality --------------------------------------------------- */}
        <div>
          <label className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-muted/80">
            Brindle&apos;s personality
          </label>
          <PersonalitySelect value={personality} onChange={setPersonality} />
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted/70">
            {personalityLabel(personality)} ·{" "}
            {listPrice && Number.isFinite(parsePrice(listPrice))
              ? `opens at ${usd(parsePrice(listPrice))}`
              : "set a list price to see the opener"}
          </p>
        </div>

        {/* Save ---------------------------------------------------------- */}
        <motion.button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          data-cursor="button"
          whileTap={reduce ? undefined : { scale: 0.96 }}
          transition={T.ui}
          className="shimmer-hover focus-glow mt-1 grid h-12 w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-gradient-to-br from-gold to-ember px-4 text-[13px] font-medium text-primary-foreground shadow-[0_0_28px_rgba(245,185,74,0.25)] disabled:opacity-70"
        >
          <span className="justify-self-center pl-6">
            {status === "saved" ? "Saved" : status === "saving" ? "Saving…" : "Save & Preview"}
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-black/15">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={iconKey}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -4 }}
                transition={T.micro}
                className="grid place-items-center"
              >
                {status === "saved" ? (
                  <Check className="h-4 w-4" />
                ) : status === "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.button>

        {/* Meta line ----------------------------------------------------- */}
        <div className="flex min-h-[18px] flex-wrap items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-ink-muted/70">
            {savedAt ? `Last saved ${formatRelativeTime(savedAt)}` : "Not listed yet"}
          </span>
          {(savedAt || flash) && (
            <button
              type="button"
              onClick={clear}
              className="text-[11px] text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Clear listing
            </button>
          )}
        </div>

        <AnimatePresence>
          {flash && (
            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-ink-muted"
            >
              {flash}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
