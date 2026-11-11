"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Cursor-spotlight surface, adapted from Magic UI's Magic Card. The glow is
 * driven by CSS custom properties so pointer movement never re-renders React.
 */
export function MagicCard({
  children,
  className,
  glow = "rgba(245, 185, 74, 0.16)",
  size = 340,
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: MouseEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn("group/magic relative overflow-hidden", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/magic:opacity-100"
        style={{
          background: `radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${glow}, transparent 72%)`,
        }}
      />
      {children}
    </div>
  );
}
