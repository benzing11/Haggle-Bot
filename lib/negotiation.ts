import { clamp } from "./format";
import type { Mood } from "./types";

export const MAX_ROUNDS = 8;
export const STARTING_PATIENCE = 100;

export type HistoryTurn = {
  role: "buyer" | "brindle";
  text: string;
  offer?: number | null;
  counter?: number | null;
};

export type Snapshot = {
  patience: number;
  round: number;
  buyerBest: number | null;
  lastOffer: number | null;
  repeatedOffer: boolean;
  lowball: boolean;
};

/**
 * Patience is recomputed from the transcript on the server every turn. The
 * client can display it, but it cannot hand us a number to trust.
 */
export function summarise(history: HistoryTurn[], listPrice: number): Snapshot {
  let patience = STARTING_PATIENCE;
  let round = 0;
  let buyerBest: number | null = null;
  let lastOffer: number | null = null;
  let repeatedOffer = false;
  let lowball = false;

  for (const turn of history) {
    if (turn.role !== "buyer") continue;
    const offer = typeof turn.offer === "number" && Number.isFinite(turn.offer)
      ? turn.offer
      : null;
    if (offer === null) continue;

    round += 1;
    lowball = offer < listPrice * 0.5;

    // Every round costs Brindle a little interest.
    patience -= 4;
    if (offer < listPrice * 0.35) patience -= 24;
    else if (lowball) patience -= 14;

    if (lastOffer !== null && Math.abs(offer - lastOffer) < 2) {
      patience -= 12;
      repeatedOffer = true;
    } else {
      repeatedOffer = false;
    }

    lastOffer = offer;
    buyerBest = buyerBest === null ? offer : Math.max(buyerBest, offer);
  }

  return {
    patience: Math.round(clamp(patience, 0, STARTING_PATIENCE)),
    round,
    buyerBest,
    lastOffer,
    repeatedOffer,
    lowball,
  };
}

export function isExpelled(snapshot: Snapshot): boolean {
  return snapshot.patience <= 0 || snapshot.round > MAX_ROUNDS;
}

/**
 * Code-enforced boundaries. The model is told about the floor, but this is
 * what actually matters: no counter can ever be below the floor or above list.
 */
export function clampCounter(
  counter: number | null,
  floorPrice: number,
  listPrice: number,
): number | null {
  if (counter === null || !Number.isFinite(counter)) return null;
  return Math.round(clamp(counter, floorPrice, listPrice) * 100) / 100;
}

export const MOOD_BY_STATE: Record<"warm" | "neutral" | "cold", Mood> = {
  warm: "amused",
  neutral: "skeptical",
  cold: "offended",
};

export function moodForSnapshot(snapshot: Snapshot): Mood {
  if (snapshot.patience <= 20) return "offended";
  if (snapshot.patience <= 55) return "skeptical";
  return "amused";
}

/** Brindle's canned lines when the shop closes itself. */
export const EXPULSION_LINES = [
  "Enough. The lamp and I have agreed to see other people. Door's behind you.",
  "That was not haggling, that was a weather event. We're closed.",
  "I've had cheaper conversations with a parking meter. Goodbye.",
];

export function pickExpulsionLine(seed: number): string {
  return EXPULSION_LINES[Math.abs(seed) % EXPULSION_LINES.length];
}

export const FALLBACK_LINES = [
  "My abacus jammed mid-sentence. Say that again, slowly, and with feeling.",
  "The ledger just sneezed. Give it a moment and try the offer again.",
  "I've lost my place in the maths. Try me once more, and be charming about it.",
];

export function pickFallbackLine(seed: number): string {
  return FALLBACK_LINES[Math.abs(seed) % FALLBACK_LINES.length];
}
