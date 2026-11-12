"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type ProductArtProps = {
  id: string;
  className?: string;
  detail?: boolean;
};

/**
 * Original, code-drawn product illustrations. No external art, no copyright
 * headaches, and they scale to any size.
 */
export function ProductArt({ id, className, detail = true }: ProductArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

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
          <stop offset="0%" stopColor="#F5B94A" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#FF7A45" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FF7A45" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE3A8" />
          <stop offset="45%" stopColor="#E0A44C" />
          <stop offset="100%" stopColor="#8A5A21" />
        </linearGradient>
        <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2E4F4C" />
          <stop offset="100%" stopColor="#162A29" />
        </linearGradient>
        <linearGradient id={`${uid}-box`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B4A86" />
          <stop offset="100%" stopColor="#2C2344" />
        </linearGradient>
        <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D9A05F" />
          <stop offset="100%" stopColor="#7A4A22" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="88" fill={`url(#${uid}-glow)`} />

      {id === "lamp" && (
        <g>
          <path
            d="M78 54h44l20 40H58l20-40Z"
            fill={`url(#${uid}-metal)`}
            stroke="rgba(255,240,210,0.35)"
            strokeWidth="1"
          />
          <path d="M58 94h84" stroke="rgba(255,240,210,0.45)" strokeWidth="1.5" />
          <path d="M63 94h74l-6 10H69l-6-10Z" fill="#8A5A21" opacity="0.55" />
          <rect x="96" y="104" width="8" height="52" rx="4" fill={`url(#${uid}-metal)`} />
          <ellipse cx="100" cy="160" rx="34" ry="8" fill="#1A1610" stroke="rgba(245,185,74,0.35)" />
          <ellipse cx="100" cy="157" rx="26" ry="5" fill="#2A2318" />
          <path d="M70 118h60l-14 26H84l-14-26Z" fill="#F5B94A" opacity="0.08" />
          {detail && (
            <g opacity="0.5">
              <path d="M100 52V34M88 56l-6-14M112 56l6-14" stroke="#F5B94A" strokeWidth="1" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}

      {id === "backpack" && (
        <g>
          <path
            d="M64 82c0-20 16-32 36-32s36 12 36 32v52c0 12-8 18-18 18H82c-10 0-18-6-18-18V82Z"
            fill={`url(#${uid}-cloth)`}
            stroke="rgba(140,220,205,0.35)"
          />
          <path
            d="M64 96c12 8 24 11 36 11s24-3 36-11v-9c-12 8-24 11-36 11s-24-3-36-11v9Z"
            fill="#0F1F1E"
            stroke="rgba(140,220,205,0.25)"
          />
          <rect x="88" y="106" width="24" height="16" rx="4" fill="#0E1A19" stroke="rgba(140,220,205,0.3)" />
          <path d="M70 70c-8 4-12 12-12 22" stroke="rgba(140,220,205,0.4)" strokeWidth="2" strokeLinecap="round" />
          <path d="M130 70c8 4 12 12 12 22" stroke="rgba(140,220,205,0.4)" strokeWidth="2" strokeLinecap="round" />
          {detail && (
            <g>
              <ellipse cx="88" cy="86" rx="4.2" ry="5.4" fill="#BFEFE4" />
              <ellipse cx="112" cy="86" rx="4.2" ry="5.4" fill="#BFEFE4" />
              <ellipse cx="88.6" cy="87" rx="1.8" ry="2.6" fill="#0B1514" />
              <ellipse cx="112.6" cy="87" rx="1.8" ry="2.6" fill="#0B1514" />
              <path d="M94 98c3 2.5 9 2.5 12 0" stroke="#BFEFE4" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}

      {id === "mystery" && (
        <g>
          <path d="M56 84l44-20 44 20-44 20-44-20Z" fill="#6E58A8" />
          <path d="M56 84v56l44 20V104L56 84Z" fill={`url(#${uid}-box)`} />
          <path d="M144 84v56l-44 20V104l44-20Z" fill="#241C3A" />
          <path d="M78 74l44 20v18L78 92V74Z" fill="#F5B94A" opacity="0.85" />
          <path d="M122 94l22-10v18l-22 10V94Z" fill="#C98B2E" opacity="0.9" />
          <path d="M100 64v18" stroke="#FFE3A8" strokeWidth="2" opacity="0.5" />
          <circle cx="100" cy="66" r="6" stroke="#FFE3A8" strokeWidth="2" opacity="0.5" />
          {detail && (
            <g>
              <text
                x="100"
                y="146"
                textAnchor="middle"
                fontFamily="serif"
                fontSize="38"
                fill="#F5B94A"
                opacity="0.85"
              >
                ?
              </text>
              <circle cx="146" cy="62" r="2" fill="#F5B94A" opacity="0.7" />
              <circle cx="58" cy="58" r="1.5" fill="#F5B94A" opacity="0.5" />
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

      {id === "chess" && (
        <g>
          <path d="M52 138l48-26 48 26-48 24-48-24Z" fill="#1E1A16" stroke="rgba(245,185,74,0.3)" />
          <path d="M52 138v8l48 24 48-24v-8" fill="#151210" stroke="rgba(245,185,74,0.18)" />
          <g stroke="rgba(245,185,74,0.18)">
            <path d="M64 135l36-19M80 143l36-19M96 151l36-19M112 159l36-19" />
            <path d="M76 129l36 18M92 122l36 18M108 115l36 18" />
          </g>
          <g>
            <path d="M80 120c0-10 4-14 4-22 0-4-3-6-3-10 0-4 3-6 7-6s7 2 7 6c0 4-3 6-3 10 0 8 4 12 4 22H80Z" fill={`url(#${uid}-wood)`} />
            <path d="M76 122h32v6H76z" fill="#5C3517" />
          </g>
          <g>
            <path d="M115 112c2-14 8-18 8-28 0-6-4-9-4-13 0-5 4-8 9-8s9 3 9 8c0 4-4 7-4 13 0 10 6 14 8 28h-26Z" fill={`url(#${uid}-metal)`} />
            <path d="M111 114h34v7h-34z" fill="#8A5A21" />
            <path d="M118 62l3-8 4 6 4-8 4 8 4-6 3 8" fill="#FFE3A8" opacity="0.9" />
          </g>
          <path d="M100 96v14" stroke="rgba(255,240,210,0.3)" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
