"use client";

import { AnimatePresence, motion } from "motion/react";

import { EASE_OUT } from "@/lib/motion";
import { MOOD_LOOK } from "@/lib/mood";
import type { Mood } from "@/lib/types";

export function Ambient({ mood = "amused" }: { mood?: Mood }) {
  const look = MOOD_LOOK[mood];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {/* Mood tint: crossfades rather than popping when Brindle changes face. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={mood}
          className="ambient-blob absolute left-1/2 top-[38%] h-[78vw] w-[78vw] min-h-[520px] min-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          style={{
            background: `radial-gradient(circle, ${look.glow}, transparent 68%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
      </AnimatePresence>

      <div
        className="ambient-blob animate-aurora absolute -left-[24%] -top-[26%] h-[64vw] w-[64vw] min-h-[420px] min-w-[420px] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(245,185,74,0.16), transparent 66%)",
        }}
      />
      <div
        className="ambient-blob animate-aurora absolute -right-[18%] top-[6%] h-[52vw] w-[52vw] min-h-[360px] min-w-[360px] rounded-full blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(255,122,69,0.12), transparent 68%)",
          animationDelay: "-9s",
        }}
      />
      <div
        className="ambient-blob animate-aurora absolute bottom-[-30%] left-[26%] h-[58vw] w-[58vw] min-h-[380px] min-w-[380px] rounded-full blur-[140px]"
        style={{
          background: "radial-gradient(circle, rgba(126,101,255,0.09), transparent 68%)",
          animationDelay: "-16s",
        }}
      />

      <div className="noise-overlay absolute inset-0 opacity-[0.04] mix-blend-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,transparent_30%,rgba(7,7,10,0.85)_100%)]" />
    </div>
  );
}
