/**
 * The four languages Brindle haggles in. One list feeds the selector, the
 * request body, the system prompt and the placeholder hints, so a new language
 * can never be half-wired.
 */

export const LANGUAGE_CODES = ["en", "es", "ru", "de"] as const;

export type Language = (typeof LANGUAGE_CODES)[number];

export type LanguageLook = {
  code: Language;
  /** Regional-indicator flag, decorative only. */
  flag: string;
  /** Two-letter label used in the pill. */
  short: string;
  /** Name handed to the model. */
  name: string;
};

export const LANGUAGES: LanguageLook[] = [
  { code: "en", flag: "🇬🇧", short: "EN", name: "English" },
  { code: "es", flag: "🇪🇸", short: "ES", name: "Spanish" },
  { code: "ru", flag: "🇷🇺", short: "RU", name: "Russian" },
  { code: "de", flag: "🇩🇪", short: "DE", name: "German" },
];

export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === "string" &&
    (LANGUAGE_CODES as readonly string[]).includes(value)
  );
}

export function languageName(code: Language): string {
  return LANGUAGES.find((language) => language.code === code)?.name ?? "English";
}

/**
 * Words that lean a message toward one language. Common ones are worth a
 * point; distinctive ones are worth two, so "gracias" alone can decide.
 */
const COMMON_WORDS: Record<Language, readonly string[]> = {
  en: [
    "the", "is", "and", "you", "it", "of", "to", "for", "with", "this",
    "that", "a", "i", "my", "your", "do", "not", "how", "much", "would",
    "could", "can", "at", "on", "in", "be", "have", "was", "are", "just",
    "but", "so", "if", "we", "they", "he", "she", "me", "no", "yes", "cash",
  ],
  es: [
    "el", "la", "los", "las", "es", "que", "por", "para", "con", "una", "un",
    "y", "de", "en", "lo", "me", "mi", "tu", "su", "pero", "muy", "esta",
    "hoy", "no", "si", "como", "mas", "tengo", "quiero", "puedo", "estoy",
    "son", "del", "al", "se", "te", "le", "nada", "algo", "todo", "este",
  ],
  ru: [],
  de: [
    "der", "die", "das", "und", "ist", "ich", "nicht", "was", "für", "mit",
    "ein", "eine", "einen", "aber", "sehr", "auch", "noch", "haben", "kann",
    "heute", "mir", "mich", "du", "sie", "wir", "zu", "im", "dem", "den",
    "des", "sind", "nur", "schon", "mal", "doch", "es", "mein", "dein",
  ],
};

const TELLING_WORDS: Record<Language, readonly string[]> = {
  en: ["please", "thanks", "thank", "offer", "price", "dollars", "cheap", "expensive"],
  es: [
    "hola", "gracias", "precio", "cuanto", "compro", "oferta", "dinero",
    "rebaja", "barato", "caro", "vendo", "efectivo", "porfa", "cuánto", "sí",
  ],
  ru: [],
  de: [
    "hallo", "danke", "bitte", "preis", "angebot", "rabatt", "geld",
    "kaufen", "teuer", "günstig", "günstiger", "zahlen", "euro",
  ],
};

/**
 * Guesses the language the buyer is actually writing in, so Brindle answers
 * the language he was spoken to even when the pills say otherwise. Script
 * detection settles Russian outright; the others are scored by vocabulary and
 * left alone when the evidence is thin.
 */
export function detectLanguage(text: string): Language | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/[\u0400-\u04FF]/.test(trimmed)) return "ru";

  const words = trimmed.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  if (!words.length) return null;

  const scores: Record<Language, number> = { en: 0, es: 0, ru: 0, de: 0 };
  for (const word of words) {
    for (const code of ["en", "es", "de"] as const) {
      if (TELLING_WORDS[code].includes(word)) scores[code] += 2;
      else if (COMMON_WORDS[code].includes(word)) scores[code] += 1;
    }
  }

  const candidates = ["en", "es", "de"] as const;
  const ranked = [...candidates].sort((a, b) => scores[b] - scores[a]);
  const [best, second] = ranked;
  // Thin evidence or a near-tie stays with whatever the buyer selected.
  if (scores[best] < 2) return null;
  if (scores[best] - scores[second] < 2) return null;
  return best;
}

/** Hints for the reason field, cycled every six seconds while it is empty. */
export const PLACEHOLDERS: Record<Language, readonly string[]> = {
  en: [
    "Add a reason, a compliment, a sob story...",
    "Try flattery. Brindle responds to it.",
    "Make your case. Or just beg. Up to you.",
    "A good story is worth five dollars off.",
  ],
  es: [
    "Añade una razón, un cumplido, una historia triste...",
    "Prueba la adulación. Brindle responde bien.",
    "Defiende tu oferta. O simplemente ruega.",
    "Una buena historia vale cinco dólares menos.",
  ],
  ru: [
    "Добавь причину, комплимент, душещипательную историю...",
    "Попробуй лесть. Бриндл на неё клюёт.",
    "Объясни свою цену. Или просто умоляй.",
    "Хорошая история стоит пяти долларов скидки.",
  ],
  de: [
    "Gib einen Grund, ein Kompliment, eine rührende Geschichte an...",
    "Versuche Schmeichelei. Brindle reagiert darauf.",
    "Verteidige dein Angebot. Oder bitte einfach.",
    "Eine gute Geschichte ist fünf Dollar Rabatt wert.",
  ],
};
