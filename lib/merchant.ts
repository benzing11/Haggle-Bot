import type { Product } from "./types";

/**
 * The merchant listing lives in the browser (there is no auth or database in
 * this demo). The shelf and the room read it from here; the floor never leaves
 * the browser except in the negotiate request the buyer's own browser makes.
 */
export const MERCHANT_STORAGE_KEY = "haggle_merchant_config";

export type PersonalityId =
  | "fair_trader"
  | "tough_negotiator"
  | "pushover"
  | "wildcard";

export type MerchantConfig = {
  name: string;
  description: string;
  listPrice: number;
  floorPrice: number;
  personality: PersonalityId;
  savedAt: string;
};

export type Personality = {
  id: PersonalityId;
  name: string;
  description: string;
};

export const PERSONALITIES: Personality[] = [
  {
    id: "fair_trader",
    name: "Fair Trader",
    description: "Reasonable. Concedes steadily. Reward good reasoning.",
  },
  {
    id: "tough_negotiator",
    name: "Tough Negotiator",
    description: "Holds firm. Small drops. Tests the buyer's patience.",
  },
  {
    id: "pushover",
    name: "Pushover",
    description: "Folds quickly. Hates conflict. Easy to charm.",
  },
  {
    id: "wildcard",
    name: "Wildcard",
    description: "Unpredictable. Could be generous or stubborn. Mood-driven.",
  },
];

export const PERSONALITY_IDS = PERSONALITIES.map(
  (personality) => personality.id,
) as [PersonalityId, ...PersonalityId[]];

export function isPersonality(value: unknown): value is PersonalityId {
  return (
    typeof value === "string" &&
    PERSONALITIES.some((personality) => personality.id === value)
  );
}

export function personalityLabel(id: PersonalityId): string {
  return PERSONALITIES.find((personality) => personality.id === id)?.name ?? "";
}

export function personalityDescription(id: PersonalityId): string {
  return (
    PERSONALITIES.find((personality) => personality.id === id)?.description ?? ""
  );
}

/** Brindle's canned first line for a listing, per personality. */
const OPENERS: Record<PersonalityId, string> = {
  fair_trader:
    "Ah, a new object on the counter. I'm told it's worth every cent — let's find out what you think that is.",
  tough_negotiator:
    "Fresh stock. I don't move much on price, so bring your best number and your best reason.",
  pushover:
    "Oh — hello. I'm not much good at this. Make me an offer and I'll probably say yes.",
  wildcard:
    "New arrival. I haven't decided how I feel about it yet. Neither, apparently, have you. Shall we?",
};

export function parseMerchantConfig(value: unknown): MerchantConfig | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  const listPrice = typeof raw.listPrice === "number" ? raw.listPrice : Number.NaN;
  const floorPrice =
    typeof raw.floorPrice === "number" ? raw.floorPrice : Number.NaN;
  const savedAt = typeof raw.savedAt === "string" ? raw.savedAt : "";

  if (!name || name.length > 80) return null;
  if (!Number.isFinite(listPrice) || listPrice <= 0 || listPrice > 100_000) {
    return null;
  }
  if (
    !Number.isFinite(floorPrice) ||
    floorPrice <= 0 ||
    floorPrice >= listPrice
  ) {
    return null;
  }
  if (!isPersonality(raw.personality)) return null;
  if (!savedAt || Number.isNaN(Date.parse(savedAt))) return null;

  return {
    name,
    description: description.slice(0, 200),
    listPrice: Math.round(listPrice * 100) / 100,
    floorPrice: Math.round(floorPrice * 100) / 100,
    personality: raw.personality,
    savedAt,
  };
}

/* ------------------------------------------------------------------ store */

/**
 * The listing lives in memory, for this visit only. It survives the client-side
 * trip to /merchant and back, and disappears on refresh — nothing is written to
 * storage, so a test listing can never outlive the tab.
 */
let config: MerchantConfig | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  // Earlier builds saved listings to localStorage; sweep those away.
  try {
    window.localStorage.removeItem(MERCHANT_STORAGE_KEY);
  } catch {
    // Storage may be unavailable; nothing to clean.
  }
}

export function getMerchantSnapshot(): MerchantConfig | null {
  return config;
}

export const getMerchantServerSnapshot = (): MerchantConfig | null => null;

export function subscribeMerchant(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function writeMerchantConfig(
  input: Omit<MerchantConfig, "savedAt">,
): MerchantConfig {
  config = { ...input, savedAt: new Date().toISOString() };
  emit();
  return config;
}

export function clearMerchantConfig(): void {
  config = null;
  emit();
}

/* ------------------------------------------------------------------ shapes */

export function merchantToProduct(
  config: Omit<MerchantConfig, "savedAt"> & { savedAt?: string },
): Product {
  return {
    id: "merchant",
    name: config.name,
    shortName: "Your listing",
    tagline: config.description || "Your own object, on Brindle's shelf.",
    blurb:
      config.description ||
      "A listing from your shop. Brindle will haggle it his way.",
    opening: OPENERS[config.personality],
    listPrice: config.listPrice,
    specs: [
      `Personality: ${personalityLabel(config.personality)}`,
      "Floor hidden from buyers",
      config.savedAt ? `Listed ${formatRelativeTime(config.savedAt)}` : "Freshly listed",
    ],
    glow: "rgba(245, 185, 74, 0.5)",
  };
}

/* ------------------------------------------------------------- formatting */

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "just now";

  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "just now";
  if (seconds < 90) return "a minute ago";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;

  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/* ------------------------------------------------------------- validation */

export type MerchantDraft = {
  name: string;
  description: string;
  listPrice: string;
  floorPrice: string;
  personality: PersonalityId;
};

export type MerchantErrors = Partial<
  Record<"name" | "listPrice" | "floorPrice", string>
>;

export function parsePrice(value: string): number {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
}

export function validateMerchantDraft(draft: MerchantDraft): MerchantErrors {
  const errors: MerchantErrors = {};

  if (!draft.name.trim()) {
    errors.name = "Give your product a name.";
  }

  const list = parsePrice(draft.listPrice);
  const floor = parsePrice(draft.floorPrice);

  if (!Number.isFinite(list) || list <= 0) {
    errors.listPrice = "Set a list price above zero.";
  }
  if (!Number.isFinite(floor) || floor <= 0) {
    errors.floorPrice = "Set a floor price above zero.";
  } else if (Number.isFinite(list) && list > 0 && floor >= list) {
    errors.floorPrice = "Your floor can't be higher than your list price.";
  }

  return errors;
}
