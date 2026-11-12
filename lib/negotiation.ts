import { clamp } from "./format";
import { DEFAULT_LANGUAGE, type Language } from "./language";
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

/**
 * Brindle's canned lines, in every language he haggles in. These are the only
 * dialogue the server writes itself, so they must never break character by
 * answering a Russian buyer in English.
 */
export const EXPULSION_LINES: Record<Language, readonly string[]> = {
  en: [
    "Enough. This item and I have agreed to see other people. Door's behind you.",
    "That was not haggling, that was a weather event. We're closed.",
    "I've had cheaper conversations with a parking meter. Goodbye.",
  ],
  es: [
    "Basta. Este objeto y yo hemos decidido ver a otras personas. La puerta está detrás de ti.",
    "Eso no fue negociar, fue un fenómeno meteorológico. Estamos cerrados.",
    "He tenido conversaciones más baratas con un parquímetro. Adiós.",
  ],
  ru: [
    "Хватит. Мы с этим предметом решили встречаться с другими. Дверь за тобой.",
    "Это была не торговля, а стихийное бедствие. Мы закрыты.",
    "Я обсуждал цены и с паркоматом дешевле. Прощай.",
  ],
  de: [
    "Genug. Dieses Stück und ich sehen uns jetzt andere Leute an. Die Tür ist hinter dir.",
    "Das war kein Feilschen, das war ein Wetterereignis. Wir haben geschlossen.",
    "Ich hatte billigere Gespräche mit einem Parkautomaten. Auf Wiedersehen.",
  ],
};

export function pickExpulsionLine(
  seed: number,
  language: Language = DEFAULT_LANGUAGE,
): string {
  const lines = EXPULSION_LINES[language] ?? EXPULSION_LINES[DEFAULT_LANGUAGE];
  return lines[Math.abs(seed) % lines.length];
}

export const FALLBACK_LINES: Record<Language, readonly string[]> = {
  en: [
    "My abacus jammed mid-sentence. Say that again, slowly, and with feeling.",
    "The ledger just sneezed. Give it a moment and try the offer again.",
    "I've lost my place in the maths. Try me once more, and be charming about it.",
  ],
  es: [
    "Mi ábaco se atascó a mitad de frase. Dilo otra vez, despacio y con sentimiento.",
    "El libro de cuentas acaba de estornudar. Dame un momento y repite la oferta.",
    "He perdido el hilo de las cuentas. Inténtalo otra vez, y sé encantador.",
  ],
  ru: [
    "Мои счёты заклинило на полуслове. Повтори, медленно и с чувством.",
    "Гроссбух только что чихнул. Дай мне мгновение и повтори предложение.",
    "Я потерял счёт. Попробуй ещё раз, и будь обаятелен.",
  ],
  de: [
    "Mein Abakus hat mitten im Satz geklemmt. Sag das noch einmal, langsam und mit Gefühl.",
    "Das Hauptbuch hat gerade geniest. Gib mir einen Moment und wiederhole das Angebot.",
    "Ich habe den Faden in der Rechnung verloren. Versuch es noch einmal, und sei charmant.",
  ],
};

export function pickFallbackLine(
  seed: number,
  language: Language = DEFAULT_LANGUAGE,
): string {
  const lines = FALLBACK_LINES[language] ?? FALLBACK_LINES[DEFAULT_LANGUAGE];
  return lines[Math.abs(seed) % lines.length];
}

/** Status messages the route returns without asking the model. */
export const RATE_LIMIT_LINES: Record<Language, string> = {
  en: "One at a time, please. I'm not a kiosk.",
  es: "De uno en uno, por favor. No soy un kiosco.",
  ru: "По одному, пожалуйста. Я тебе не автомат.",
  de: "Eins nach dem anderen, bitte. Ich bin kein Automat.",
};

export const UNCONFIGURED_LINES: Record<Language, string> = {
  en: "My abacus jammed — nobody has plugged in my brain. Add a model API key and try that again.",
  es: "Mi ábaco se atascó: nadie ha conectado mi cerebro. Añade una clave de modelo y vuelve a intentarlo.",
  ru: "Мои счёты заклинило: мне так и не подключили мозги. Добавь ключ модели и попробуй снова.",
  de: "Mein Abakus klemmt: Niemand hat mein Gehirn angeschlossen. Füge einen Modellschlüssel hinzu und versuch es erneut.",
};
