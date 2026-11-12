import type { Product } from "./types";

/**
 * Public catalogue. This file is imported by client components, so it must
 * never contain a floor price or any other secret. The confidential half of
 * each product lives in `lib/products.server.ts`.
 */
export const PRODUCTS: Product[] = [
  {
    id: "almost-right-clock",
    name: "The Clock That's Always Almost Right",
    shortName: "Clock",
    tagline: "Accurate twice a day. More, if you're lucky.",
    blurb:
      "A melting pocket watch of uncertain provenance. It has never been fully wrong, which is more than most people can say. Time is a suggestion, and this clock is very relaxed about it.",
    opening:
      "Ah, the clock. It has been right twice today already — quite the overachiever. Ninety-five dollars, and I'll throw in the uncertainty for free.",
    listPrice: 95,
    specs: [
      "Handcrafted in a timezone of its choosing",
      "Gains 4 minutes weekly (net positive)",
      'Comes with a note: "close enough"',
    ],
    glow: "rgba(245, 185, 74, 0.55)",
  },
  {
    id: "ambition-jar",
    name: "A Jar of Someone Else's Ambition",
    shortName: "Ambition Jar",
    tagline: "Previous owner was very motivated. For about a week.",
    blurb:
      "A glowing mason jar of pure, pre-owned motivation. The original owner pivoted to ceramics. Their ambition, however, remains potent. Contents may include: one half-finished business plan, the confidence to email back, and a vague sense of urgency.",
    opening:
      "Careful with that one. The ambition inside is still warm. Someone sealed it in a hurry. Seventy dollars, and it's your problem now.",
    listPrice: 70,
    specs: [
      "Sealed for freshness since last January",
      "Contains approx. 3–4 unrealised ideas",
      "Best before: whenever you're ready",
    ],
    glow: "rgba(92, 225, 178, 0.40)",
  },
  {
    id: "mild-sword",
    name: "The Sword of Mild Inconvenience",
    shortName: "Sword",
    tagline: "Not evil. Not heroic. Just kind of in the way.",
    blurb:
      "A legendary blade of underwhelming power. It won't slay dragons, but it will absolutely cause someone to stub their toe or miss a bus. Comes lodged in a small commemorative stone. The stone is decorative. The inconvenience is real.",
    opening:
      "The Sword of Mild Inconvenience. Responsible for seventeen missed appointments and one very awkward dinner party. One hundred and thirty dollars, and it comes with the stone.",
    listPrice: 130,
    specs: [
      "Forged in an era of moderate grievances",
      "Causes minor disruption within a 2ft radius",
      "Previous owner: a middle manager",
    ],
    glow: "rgba(150, 180, 230, 0.42)",
  },
  {
    id: "honest-mirror",
    name: "A Mirror That's Probably Honest",
    shortName: "Mirror",
    tagline: "Reflects your best self. Results may vary.",
    blurb:
      "An ornate oval mirror of ambiguous truthfulness. Most mirrors show you what's there. This one shows you what's there, with editorial discretion. The crack appeared on its own. We consider this a feature.",
    opening:
      "She's mostly honest. The crack you see is the crack you get. One hundred and ten dollars, and she'll probably say something kind about you. Probably.",
    listPrice: 110,
    specs: [
      "Accuracy: statistically above average",
      "One hairline crack (adds character, per the last owner)",
      "Does not reflect bad decisions",
    ],
    glow: "rgba(150, 200, 255, 0.42)",
  },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}
