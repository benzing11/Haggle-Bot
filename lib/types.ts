export type Mood =
  | "delighted"
  | "amused"
  | "skeptical"
  | "offended"
  | "defeated";

export const MOODS: Mood[] = [
  "delighted",
  "amused",
  "skeptical",
  "offended",
  "defeated",
];

export type Product = {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  blurb: string;
  opening: string;
  listPrice: number;
  specs: string[];
  /** CSS colour used for the card glow. */
  glow: string;
};

export type ChatMessage = {
  id: string;
  role: "buyer" | "brindle";
  text: string;
  offer?: number | null;
  counter?: number | null;
  mood?: Mood;
  /** `deal` and `expired` are rendered as system-ish cards inside the chat. */
  kind?: "message" | "deal" | "expired";
};

export type NegotiationStats = {
  patience: number;
  round: number;
  maxRounds: number;
  mood: Mood;
  counter: number | null;
  buyerBest: number | null;
  expelled: boolean;
};

export type Deal = {
  token: string;
  price: number;
  expiresAt: number;
};

export type Receipt = {
  orderId: string;
  captureId: string;
  amount: number;
  currency: string;
  payerName: string | null;
  productName: string;
  listPrice: number;
  paidAt: number;
};

export type Phase = "SHELF" | "ROOM" | "DEAL" | "PAID" | "EXPELLED";
