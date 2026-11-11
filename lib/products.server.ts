import "server-only";

import { PRODUCTS } from "./products";
import type { Product } from "./types";

export type ServerProduct = Product & {
  /** Confidential. Never serialised to the browser. */
  floorPrice: number;
};

/**
 * Floor prices live only on the server. Roughly 55–70% of list. If the model
 * ever returns something below this, the route clamps it back up.
 */
const FLOOR_PRICES: Record<string, number> = {
  lamp: 72, // 60% of 120
  backpack: 51, // 60% of 85
  mystery: 33, // 55% of 60
  chess: 96, // 64% of 150
};

const SERVER_PRODUCTS: ServerProduct[] = PRODUCTS.map((product) => ({
  ...product,
  floorPrice: FLOOR_PRICES[product.id] ?? Math.round(product.listPrice * 0.6),
}));

export function getServerProduct(id: string): ServerProduct | null {
  return SERVER_PRODUCTS.find((product) => product.id === id) ?? null;
}
