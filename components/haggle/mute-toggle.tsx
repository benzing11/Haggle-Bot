"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { sound } from "@/lib/sound";
import { speech } from "@/lib/speech";
import { cn } from "@/lib/utils";

export function MuteToggle({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const muted = useSyncExternalStore(
    sound.subscribe,
    sound.getSnapshot,
    () => false,
  );
  const speaking = useSyncExternalStore(
    speech.subscribe,
    speech.getSnapshot,
    () => false,
  );

  function toggle() {
    const next = !sound.muted;
    sound.setMuted(next);
    sound.unlock();
    // Muting must stop Brindle mid-sentence, not just the chimes.
    if (next) speech.cancel();
    else sound.play("tick");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      data-cursor="button"
      title={muted ? "Unmute sound" : "Mute sound"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-ink-muted transition-colors duration-[var(--duration-micro)] hover:border-white/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
        className,
      )}
    >
      {muted ? (
        <VolumeX className="h-4 w-4" />
      ) : speaking ? (
        <span aria-hidden className="flex h-4 items-center gap-[2.5px]">
          {[0, 1, 2].map((bar) => (
            <motion.span
              key={bar}
              className="w-[2px] rounded-full bg-current"
              initial={false}
              animate={
                reduce ? { height: bar === 1 ? 10 : 6 } : { height: [4, 12, 4] }
              }
              transition={
                reduce
                  ? undefined
                  : {
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: bar * 0.14,
                    }
              }
            />
          ))}
        </span>
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
}
