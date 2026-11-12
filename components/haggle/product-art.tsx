"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type ProductArtProps = {
  id: string;
  className?: string;
  detail?: boolean;
};

/**
 * Each object's aura, so the four cards don't share one warm wash. These mirror
 * the accent hues inside the illustrations and the card halos in lib/products.
 */
const ART_GLOW: Record<string, { core: string; edge: string }> = {
  "almost-right-clock": { core: "#F5B94A", edge: "#FF7A45" },
  "ambition-jar": { core: "#6BE8B5", edge: "#2FB58B" },
  "mild-sword": { core: "#BFD8FF", edge: "#6E8FC4" },
  "honest-mirror": { core: "#CFE4FF", edge: "#7FA8E0" },
};
const DEFAULT_GLOW = { core: "#F5B94A", edge: "#FF7A45" };

/**
 * Original, code-drawn product illustrations. No external art, no copyright
 * headaches, and they scale to any size.
 */
export function ProductArt({ id, className, detail = true }: ProductArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const glow = ART_GLOW[id] ?? DEFAULT_GLOW;

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Product illustration"
      className={cn("h-full w-full", className)}
      fill="none"
    >
      <defs>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow.core} stopOpacity="0.38" />
          <stop offset="55%" stopColor={glow.edge} stopOpacity="0.16" />
          <stop offset="100%" stopColor={glow.edge} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE6AE" />
          <stop offset="45%" stopColor="#E3A24A" />
          <stop offset="100%" stopColor="#7E4E16" />
        </linearGradient>
        <linearGradient id={`${uid}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4F8FF" />
          <stop offset="45%" stopColor="#B4C6E0" />
          <stop offset="100%" stopColor="#5E7089" />
        </linearGradient>
        <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2F6B5E" />
          <stop offset="100%" stopColor="#12332E" />
        </linearGradient>
        <linearGradient id={`${uid}-box`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B4A86" />
          <stop offset="100%" stopColor="#2C2344" />
        </linearGradient>
        <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2A760" />
          <stop offset="100%" stopColor="#6B3D18" />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B7AA8" />
          <stop offset="55%" stopColor="#A8C4E6" />
          <stop offset="100%" stopColor="#EAF2FF" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="88" fill={`url(#${uid}-glow)`} />

      {id === "almost-right-clock" && (
        <g>
          {/* velvet stand */}
          <ellipse
            cx="100"
            cy="158"
            rx="46"
            ry="10"
            fill="#1B1410"
            stroke="rgba(245,185,74,0.28)"
          />
          <path
            d="M74 158c6-16 14-24 26-24s20 8 26 24Z"
            fill={`url(#${uid}-cloth)`}
            opacity="0.9"
          />

          {/* pocket watch, tilted at a jaunty angle */}
          <g transform="rotate(-14 100 100)">
            <circle
              cx="100"
              cy="96"
              r="40"
              fill={`url(#${uid}-metal)`}
              stroke="rgba(255,240,210,0.4)"
            />
            <circle cx="100" cy="96" r="32" fill="#20180F" />
            <circle
              cx="100"
              cy="96"
              r="32"
              stroke="rgba(255,227,168,0.45)"
              strokeWidth="1"
            />

            {/* hour marks */}
            <g
              stroke="rgba(255,227,168,0.55)"
              strokeWidth="1.4"
              strokeLinecap="round"
            >
              <path d="M100 70v5M100 117v5M74 96h5M121 96h5" />
            </g>

            {/* hands that are almost right */}
            <path
              d="M100 96l-13-11"
              stroke="#FFEFC2"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M100 96l16 5"
              stroke="#F5B94A"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="100" cy="96" r="2.6" fill="#FFEFC2" />

            {/* the melting bit */}
            <path
              d="M118 124c7 8 9 17 4 23-4 6-12 5-14-3-2-7 3-14 10-20Z"
              fill={`url(#${uid}-metal)`}
              opacity="0.85"
            />

            {/* crown and loop */}
            <path
              d="M100 56v-7"
              stroke={`url(#${uid}-metal)`}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="43"
              r="5"
              stroke={`url(#${uid}-metal)`}
              strokeWidth="2.5"
            />
          </g>

          {/* tick marks orbiting like planets */}
          {detail && (
            <g
              stroke="#F5B94A"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.65"
            >
              <path d="M40 70l4 3M160 70l-4 3M46 132l5-2M155 130l-5-2M100 18v5M72 24l2 5M128 24l-2 5" />
            </g>
          )}
        </g>
      )}

      {id === "ambition-jar" && (
        <g>
          {/* dark surface */}
          <ellipse
            cx="100"
            cy="162"
            rx="48"
            ry="9"
            fill="#171008"
            stroke="rgba(120,230,180,0.25)"
          />

          {/* light coming from inside */}
          <ellipse cx="100" cy="116" rx="32" ry="36" fill="#6BE8B5" opacity="0.26" />

          {/* jar */}
          <path
            d="M78 68h44v8c0 5 8 9 8 19v49c0 10-8 16-18 16H88c-10 0-18-6-18-16V95c0-10 8-14 8-19v-8Z"
            fill="rgba(170,255,225,0.12)"
            stroke="rgba(190,255,232,0.5)"
            strokeWidth="1.4"
          />

          {/* what's left of someone's motivation */}
          <path
            d="M74 108c8 4 18 6 26 6s18-2 26-6v35c0 8-7 13-16 13H90c-9 0-16-5-16-13v-35Z"
            fill="#3FD6A0"
            opacity="0.42"
          />

          {/* cork lid */}
          <rect
            x="84"
            y="52"
            width="32"
            height="13"
            rx="4"
            fill={`url(#${uid}-wood)`}
            stroke="rgba(255,227,168,0.4)"
          />
          <ellipse
            cx="100"
            cy="65"
            rx="18"
            ry="4.5"
            fill="#D99A34"
            stroke="rgba(255,227,168,0.5)"
          />

          {/* sparks and little bolts */}
          <g
            stroke="#DFFFF2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M94 92l-6 12h7l-4 10 12-14h-7l4-8" />
            <path d="M115 116l-4 8h5l-3 7 8-10h-5l3-5" />
          </g>

          {detail && (
            <g>
              <circle cx="76" cy="86" r="1.6" fill="#DFFFF2" opacity="0.8" />
              <circle cx="126" cy="100" r="1.3" fill="#DFFFF2" opacity="0.6" />
              <circle cx="84" cy="128" r="1.1" fill="#DFFFF2" opacity="0.5" />
              <circle cx="118" cy="74" r="1" fill="#7CF0C6" opacity="0.7" />
            </g>
          )}
        </g>
      )}

      {id === "mild-sword" && (
        <g>
          {/* the small commemorative stone */}
          <path
            d="M62 150c0-13 13-21 27-23 8-1 12-6 20-6 17 0 31 10 31 27 0 10-10 16-25 17l-34 1c-11 0-19-6-19-16Z"
            fill="#2A2622"
            stroke="rgba(150,180,230,0.35)"
          />

          {/* plaque */}
          <rect
            x="84"
            y="153"
            width="33"
            height="12"
            rx="2"
            fill={`url(#${uid}-metal)`}
            opacity="0.9"
          />
          <path
            d="M90 157h21M90 161h13"
            stroke="rgba(42,27,8,0.55)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* blade, slightly too big for its stone */}
          <path
            d="M92 64h16l-3 74h-10l-3-74Z"
            fill={`url(#${uid}-steel)`}
            stroke="rgba(225,240,255,0.55)"
            strokeWidth="1"
          />
          <path d="M100 64v72" stroke="rgba(255,255,255,0.65)" strokeWidth="1" />

          {/* crossguard */}
          <path
            d="M72 60h56"
            stroke="#7E4E16"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M72 60h56"
            stroke="#FFE6AE"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* grip and pommel */}
          <rect x="96" y="36" width="8" height="22" rx="4" fill={`url(#${uid}-wood)`} />
          <circle
            cx="100"
            cy="29"
            r="6"
            fill={`url(#${uid}-metal)`}
            stroke="rgba(255,240,210,0.5)"
          />

          {/* faintly glowing blade */}
          {detail && (
            <g opacity="0.55">
              <path
                d="M100 76v50"
                stroke="#CFE4FF"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.3"
              />
              <circle cx="64" cy="98" r="1.6" fill="#CFE4FF" />
              <circle cx="138" cy="112" r="1.3" fill="#CFE4FF" opacity="0.7" />
              <circle cx="121" cy="82" r="1" fill="#CFE4FF" opacity="0.6" />
            </g>
          )}
        </g>
      )}

      {id === "honest-mirror" && (
        <g>
          {/* it does seem to be glowing */}
          <ellipse cx="100" cy="100" rx="48" ry="64" fill="#CFE4FF" opacity="0.1" />
          <ellipse
            cx="100"
            cy="166"
            rx="34"
            ry="7"
            fill="#171008"
            stroke="rgba(245,185,74,0.2)"
          />

          <g transform="rotate(-4 100 100)">
            {/* gold filigree frame */}
            <ellipse
              cx="100"
              cy="100"
              rx="46"
              ry="62"
              fill={`url(#${uid}-metal)`}
              stroke="rgba(255,240,210,0.45)"
            />
            <ellipse cx="100" cy="100" rx="38" ry="54" fill="#171319" />
            <ellipse
              cx="100"
              cy="100"
              rx="34"
              ry="50"
              fill={`url(#${uid}-glass)`}
              opacity="0.92"
            />

            {/* a reflection slightly brighter than it should be */}
            <path
              d="M84 74c10 8 22 10 32 4"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.62"
            />

            {/* the single elegant hairline crack */}
            <path
              d="M80 64l11 19-6 12 12 17-8 14 10 18"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.72"
            />

            {/* filigree curls */}
            <g
              stroke="rgba(255,240,210,0.7)"
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              <path d="M100 38c7 8 15 6 19 13M100 162c-7-8-15-6-19-13" />
              <path d="M63 84c-5 8-5 16 0 24M137 84c5 8 5 16 0 24" />
            </g>

            {/* crest */}
            <path
              d="M100 36c-9-9-2-15 0-17 2 2 9 8 0 17Z"
              fill={`url(#${uid}-metal)`}
            />
          </g>

          {detail && (
            <g>
              <circle cx="58" cy="66" r="1.4" fill="#CFE4FF" opacity="0.6" />
              <circle cx="143" cy="86" r="1.2" fill="#CFE4FF" opacity="0.45" />
              <circle cx="70" cy="138" r="1" fill="#CFE4FF" opacity="0.5" />
            </g>
          )}
        </g>
      )}

      {id === "merchant" && (
        <g>
          <path
            d="M104 30c-2 14-6 22-10 30"
            stroke="rgba(245,185,74,0.45)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <g transform="rotate(-9 100 108)">
            <rect
              x="64"
              y="58"
              width="72"
              height="104"
              rx="11"
              fill="#171319"
              stroke="rgba(245,185,74,0.4)"
              strokeWidth="1.2"
            />
            <circle
              cx="100"
              cy="72"
              r="4"
              fill="#07070A"
              stroke="rgba(245,185,74,0.55)"
            />
            <path
              d="M82 94h34M82 106h22M82 118h29"
              stroke="rgba(244,241,234,0.22)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <text
              x="100"
              y="150"
              textAnchor="middle"
              fontFamily="serif"
              fontSize="22"
              fill="#F5B94A"
              opacity="0.9"
            >
              $
            </text>
          </g>
          {detail && (
            <g>
              <circle
                cx="139"
                cy="150"
                r="15"
                fill={`url(#${uid}-metal)`}
                opacity="0.92"
              />
              <circle
                cx="139"
                cy="150"
                r="10.5"
                fill="none"
                stroke="rgba(28,18,6,0.35)"
                strokeWidth="1"
              />
              <text
                x="139"
                y="155"
                textAnchor="middle"
                fontFamily="serif"
                fontSize="12"
                fill="#2A1B08"
              >
                B
              </text>
              <circle cx="60" cy="70" r="1.6" fill="#F5B94A" opacity="0.6" />
              <circle cx="146" cy="92" r="1.2" fill="#F5B94A" opacity="0.45" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
