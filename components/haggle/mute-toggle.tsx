"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

export function MuteToggle({ className }: { className?: string }) {
  const muted = useSyncExternalStore(
    sound.subscribe,
    sound.getSnapshot,
    () => false,
  );

  function toggle() {
    const next = !sound.muted;
    sound.setMuted(next);
    sound.unlock();
    if (!next) sound.play("tick");
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
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
