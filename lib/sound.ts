"use client";

import { useEffect } from "react";

type SoundName = "tick" | "pop" | "chime" | "thud" | "deal" | "clink";

type WindowWithAudio = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * Tiny synthesised sounds — no asset files. Everything is generated with the
 * Web Audio API and stays silent until the first user gesture unlocks it.
 */
class SoundEngine {
  muted = false;

  private ctx: AudioContext | null = null;

  private unlocked = false;

  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.muted;

  constructor() {
    if (typeof window === "undefined") return;
    try {
      this.muted = window.localStorage.getItem("haggle:muted") === "1";
    } catch {
      this.muted = false;
    }
  }

  private context(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as WindowWithAudio).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.context();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      window.localStorage.setItem("haggle:muted", muted ? "1" : "0");
    } catch {
      // Storage is a nicety, not a requirement.
    }
    for (const listener of this.listeners) listener();
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number,
  ) {
    if (this.muted) return;
    const ctx = this.context();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const now = ctx.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(40, slideTo),
        now + duration,
      );
    }

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(envelope).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  play(name: SoundName) {
    switch (name) {
      case "tick":
        this.tone(1180, 0.05, "triangle", 0.045, 900);
        break;
      case "pop":
        this.tone(420, 0.12, "sine", 0.075, 720);
        break;
      case "chime":
        this.tone(660, 0.22, "sine", 0.08);
        window.setTimeout(() => this.tone(990, 0.28, "sine", 0.06), 90);
        break;
      case "deal":
        this.tone(523.25, 0.2, "sine", 0.075);
        window.setTimeout(() => this.tone(659.25, 0.22, "sine", 0.07), 100);
        window.setTimeout(() => this.tone(783.99, 0.36, "sine", 0.07), 200);
        break;
      case "thud":
        this.tone(150, 0.26, "sine", 0.1, 62);
        break;
      case "clink":
        // Two struck partials plus a short body: a coin landing on glass.
        this.tone(2100, 0.06, "triangle", 0.045, 1500);
        window.setTimeout(() => this.tone(2860, 0.05, "triangle", 0.03, 2150), 55);
        window.setTimeout(() => this.tone(1640, 0.13, "sine", 0.04, 1180), 105);
        break;
    }
  }

  vibrate(pattern: number | number[] = 5) {
    if (typeof navigator === "undefined") return;
    if (this.muted) return;
    if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  }
}

export const sound = new SoundEngine();

/** Unlock Web Audio on the first gesture anywhere in the app. */
export function useSoundUnlock() {
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
}
