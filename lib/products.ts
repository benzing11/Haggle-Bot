import type { Product } from "./types";

/**
 * Public catalogue. This file is imported by client components, so it must
 * never contain a floor price or any other secret. The confidential half of
 * each product lives in `lib/products.server.ts`.
 */
export const PRODUCTS: Product[] = [
  {
    id: "lamp",
    name: "The Unreasonably Good Lamp",
    shortName: "Lamp",
    tagline: "It is, frankly, too good.",
    blurb:
      "Warm, impossible light from a lamp that has no business being this good. Two settings: gentle, and dangerously gentle.",
    opening:
      "Ah, the lamp. My finest unreasonable object. It is worth every cent of the hundred and twenty, and I suspect you know it.",
    listPrice: 120,
    specs: ["Brass & smoked glass", "Two warm settings", "Cord included, regrets not"],
    glow: "rgba(245, 185, 74, 0.55)",
  },
  {
    id: "backpack",
    name: "A Slightly Haunted Backpack",
    shortName: "Backpack",
    tagline: "It remembers your lunch. Fondly.",
    blurb:
      "Canvas, leather straps, and one extremely polite presence that rearranges your pens at night. Mostly harmless. Occasionally helpful.",
    opening:
      "A haunted backpack, and only slightly. It tidies. It hums. It has opinions about your commute. Eighty-five dollars is a kindness.",
    listPrice: 85,
    specs: ["18L waxed canvas", "One (1) polite presence", "Pen pockets rearrange themselves"],
    glow: "rgba(120, 200, 190, 0.45)",
  },
  {
    id: "mystery",
    name: "Mystery Box of Mild Wonders",
    shortName: "Mystery Box",
    tagline: "Contents unknown. Disappointment unlikely.",
    blurb:
      "A sealed box containing four to six objects of gentle surprise. No returns, no spoilers, no curses above a level two.",
    opening:
      "The mystery box. I am legally forbidden from telling you what is inside, mostly because I have forgotten. Sixty dollars.",
    listPrice: 60,
    specs: ["4–6 mild wonders", "Sealed since Tuesday", "Curse level: 2 or below"],
    glow: "rgba(196, 150, 255, 0.45)",
  },
  {
    id: "chess",
    name: "Grandmaster's Questionable Chess Set",
    shortName: "Chess Set",
    tagline: "Every piece is a queen. Legally distinct.",
    blurb:
      "Hand-turned pieces from a set with unorthodox opinions about the rules. The board is flawless. The grandmaster is not included.",
    opening:
      "The chess set. Beautiful, deeply questionable, and the pawns have started negotiating too. One hundred and fifty.",
    listPrice: 150,
    specs: ["Hand-turned hardwood", "3 queens per side (disputed)", "Board folds, rules do not"],
    glow: "rgba(255, 122, 69, 0.45)",
  },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}
