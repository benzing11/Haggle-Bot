"use client";

import type { Language } from "./language";
import { sound } from "./sound";

type Listener = () => void;

type VoicePreference = {
  /** Matched as a case-insensitive substring of the browser's voice name. */
  name: string;
  rate: number;
  pitch: number;
};

/**
 * The shopkeeper's voice, best first. Google's and Apple's named voices carry
 * far more character than the raw default, so we prefer them by name and set
 * the pace per voice: slow enough to sound considered, a touch bright so he
 * never reads like a station announcer.
 */
const VOICE_PREFERENCES: readonly VoicePreference[] = [
  { name: "Google UK English Male", rate: 0.88, pitch: 1.12 },
  { name: "Google UK English Female", rate: 0.85, pitch: 0.92 },
  { name: "Daniel", rate: 0.87, pitch: 1.08 },
  { name: "Arthur", rate: 0.86, pitch: 1.1 },
  { name: "Rishi", rate: 0.9, pitch: 1.05 },
  { name: "Google US English", rate: 0.9, pitch: 1.08 },
  { name: "Samantha", rate: 0.88, pitch: 1.0 },
];

/** Tuning for every voice that is not in the preference list above. */
const FALLBACK_RATE = 0.88;
const FALLBACK_PITCH = 1.1;
/** Just under full: present, never a shout. */
const VOLUME = 0.92;

/**
 * Shapes a line for the ear only. The chat bubble keeps the original text.
 * Speech engines say "$43" as "dollar forty-three", skip em-dashes and read
 * ellipses as silence, all of which break the character.
 */
/** The word for the currency, so a Russian or Spanish voice need not say an
 * English word in the middle of its own sentence. Prices stay in USD. */
const CURRENCY: Record<Language, { one: string; many: string }> = {
  en: { one: "dollar", many: "dollars" },
  es: { one: "dólar", many: "dólares" },
  ru: { one: "доллар", many: "долларов" },
  de: { one: "Dollar", many: "Dollar" },
};

export function toSpokenText(text: string, language: Language = "en"): string {
  const currency = CURRENCY[language] ?? CURRENCY.en;
  const spoken = text
    .replace(/\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g, (_, raw: string) => {
      const [dollars, cents] = raw.replace(/,/g, "").split(".");
      const unit = dollars === "1" ? currency.one : currency.many;
      return cents ? `${dollars} ${unit} and ${cents} cents` : `${dollars} ${unit}`;
    })
    // Em and en dashes are usually dropped by the engine; a comma is the pause
    // the sentence was written for anyway.
    .replace(/\s*[—–]\s*/g, ", ")
    // No SSML in the Web Speech API, so an ellipsis becomes a full breath.
    .replace(/\.{3,}/g, ". ")
    // "Ah", "Well" and "Hmm" at the head of a sentence get the beat they need.
    .replace(/(^|[.!?]\s+)(Ah|Well|Hmm)\b(?!,)/g, "$1$2,")
    .replace(/,\s*,+/g, ",")
    .replace(/,\s*\./g, ".");

  return spoken.replace(/\s+/g, " ").trim();
}

/**
 * Brindle's voice, on the browser's own speech synthesis. No key, no network,
 * no cost. Everything here fails silently: a machine without voices simply
 * reads nothing.
 */
class SpeechEngine {
  private listeners = new Set<Listener>();

  private speaking = false;

  /** A message is read once, even if React mounts its effect twice. */
  private spoken = new Set<string>();

  private warmed = false;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.speaking;

  private emit() {
    for (const listener of this.listeners) listener();
  }

  private setSpeaking(next: boolean) {
    if (next === this.speaking) return;
    this.speaking = next;
    this.emit();
  }

  private synth(): SpeechSynthesis | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return null;
    }
    return window.speechSynthesis;
  }

  private voices(): SpeechSynthesisVoice[] {
    const synth = this.synth();
    if (!synth) return [];
    try {
      return synth.getVoices();
    } catch {
      return [];
    }
  }

  /**
   * Chrome populates the voice list asynchronously. Asking once at startup and
   * again when it changes means the first reply already gets the right voice.
   */
  warm() {
    if (this.warmed) return;
    const synth = this.synth();
    if (!synth) return;
    this.warmed = true;
    try {
      // The call itself is what makes Chrome start populating the list.
      synth.getVoices();
    } catch {
      // A voice list that never arrives is not an error worth surfacing.
    }
  }

  /**
   * Picks the voice and the tuning that belongs to it. English walks the
   * preference list; other languages take the best matching voice the machine
   * has, and fall back to the default voice in that language when it has none.
   */
  choose(language: Language): {
    voice: SpeechSynthesisVoice | null;
    rate: number;
    pitch: number;
  } {
    const voices = this.voices();

    if (language === "en" && voices.length) {
      for (const preference of VOICE_PREFERENCES) {
        const needle = preference.name.toLowerCase();
        const match = voices.find((voice) =>
          voice.name.toLowerCase().includes(needle),
        );
        if (match) {
          return {
            voice: match,
            rate: preference.rate,
            pitch: preference.pitch,
          };
        }
      }

      const english = voices.filter((voice) =>
        voice.lang?.toLowerCase().startsWith("en"),
      );
      const englishVoice =
        english.find((voice) => voice.localService) ?? english[0];
      if (englishVoice) {
        return {
          voice: englishVoice,
          rate: FALLBACK_RATE,
          pitch: FALLBACK_PITCH,
        };
      }
    }

    if (language !== "en" && voices.length) {
      const matches = voices.filter((voice) =>
        voice.lang?.toLowerCase().startsWith(language),
      );
      const match = matches.find((voice) => voice.localService) ?? matches[0];
      if (match) {
        return { voice: match, rate: FALLBACK_RATE, pitch: FALLBACK_PITCH };
      }
    }

    return { voice: null, rate: FALLBACK_RATE, pitch: FALLBACK_PITCH };
  }

  /** The voice alone, for callers that do not care about tuning. */
  pickVoice(language: Language): SpeechSynthesisVoice | null {
    return this.choose(language).voice;
  }

  cancel() {
    const synth = this.synth();
    if (synth) {
      try {
        synth.cancel();
      } catch {
        // Nothing to cancel, or the engine is gone.
      }
    }
    this.setSpeaking(false);
  }

  /** Reads one chat message exactly once. */
  speakOnce(id: string, text: string, language: Language) {
    if (this.spoken.has(id)) return;
    if (!text.trim()) return;
    this.spoken.add(id);
    this.speak(text, language);
  }

  speak(text: string, language: Language) {
    if (sound.muted) {
      this.cancel();
      return;
    }

    const synth = this.synth();
    if (!synth) return;

    const spokenText = toSpokenText(text, language);
    if (!spokenText) return;

    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenText);
      const { voice, rate, pitch } = this.choose(language);

      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = VOLUME;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = language;
      }

      if (process.env.NODE_ENV !== "production") {
        // Development only: shows which voice the machine actually handed us.
        console.log(
          "Speaking with voice:",
          voice?.name ?? "(default)",
          "rate:",
          rate,
          "pitch:",
          pitch,
        );
      }

      utterance.onstart = () => this.setSpeaking(true);
      utterance.onend = () => this.setSpeaking(false);
      utterance.onerror = () => this.setSpeaking(false);

      synth.speak(utterance);
    } catch {
      this.setSpeaking(false);
    }
  }
}

export const speech = new SpeechEngine();
