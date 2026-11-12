import { NextResponse } from "next/server";
import { z } from "zod";

import {
  askBrindle,
  BrindleUnavailableError,
  fallbackReply,
  isBrindleConfigured,
} from "@/lib/brindle";
import { createDealToken } from "@/lib/deal-token";
import {
  clampCounter,
  isExpelled,
  MAX_ROUNDS,
  pickExpulsionLine,
  summarise,
  type HistoryTurn,
} from "@/lib/negotiation";
import { merchantToProduct, PERSONALITY_IDS } from "@/lib/merchant";
import { getServerProduct, type ServerProduct } from "@/lib/products.server";

const HistorySchema = z.object({
  role: z.enum(["buyer", "brindle"]),
  text: z.string().max(400).default(""),
  offer: z.number().finite().min(0).max(100_000).nullish(),
  counter: z.number().finite().min(0).max(100_000).nullish(),
});

/** A merchant listing travels with the request: there is no server-side store. */
const MerchantSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(200).default(""),
    listPrice: z.number().finite().positive().max(100_000),
    floorPrice: z.number().finite().positive().max(100_000),
    personality: z.enum(PERSONALITY_IDS),
  })
  .refine((value) => value.floorPrice < value.listPrice, {
    message: "floor_must_be_below_list",
  });

const BodySchema = z.object({
  productId: z.string().min(1).max(64),
  message: z.string().max(280).default(""),
  offer: z.number().finite().min(1).max(100_000),
  history: z.array(HistorySchema).max(16).default([]),
  merchant: MerchantSchema.optional(),
});

/** Small in-memory limiter; enough to stop a runaway client on one instance. */
const buckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 40;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "rate_limited", reply: "One at a time, please. I'm not a kiosk." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { productId, message, offer, history, merchant } = parsed.data;

  let product: ServerProduct;
  if (productId === "merchant") {
    if (!merchant) {
      return NextResponse.json({ error: "invalid_merchant" }, { status: 400 });
    }
    product = { ...merchantToProduct(merchant), floorPrice: merchant.floorPrice };
  } else {
    const catalogueProduct = getServerProduct(productId);
    if (!catalogueProduct) {
      return NextResponse.json({ error: "unknown_product" }, { status: 404 });
    }
    product = catalogueProduct;
  }

  const cleanHistory: HistoryTurn[] = history.map((turn) => ({
    role: turn.role,
    text: turn.text.slice(0, 400),
    offer: turn.offer ?? null,
    counter: turn.counter ?? null,
  }));

  const fullHistory: HistoryTurn[] = [
    ...cleanHistory,
    { role: "buyer", text: message, offer },
  ];

  const snapshot = summarise(fullHistory, product.listPrice);

  // Brindle runs out of patience before the model is even consulted. This is
  // the only authority on when the haggle is over.
  if (isExpelled(snapshot)) {
    return NextResponse.json({
      reply: pickExpulsionLine(snapshot.round),
      mood: "defeated",
      counter: null,
      deal: false,
      price: null,
      dealToken: null,
      expiresAt: null,
      patience: 0,
      round: snapshot.round,
      maxRounds: MAX_ROUNDS,
      buyerBest: snapshot.buyerBest,
      expelled: true,
    });
  }

  if (!isBrindleConfigured()) {
    return NextResponse.json(
      {
        error: "model_unconfigured",
        reply:
          "My abacus jammed — nobody has plugged in my brain. Add a model API key and try that again.",
      },
      { status: 503 },
    );
  }

  try {
    const raw = await askBrindle({
      product,
      floorPrice: product.floorPrice,
      history: fullHistory,
      round: snapshot.round,
      maxRounds: MAX_ROUNDS,
      patience: snapshot.patience,
      buyerBest: snapshot.buyerBest,
    });

    // ---- Code-enforced guardrails -------------------------------------------
    // The floor is never trusted to the model.
    let counter = clampCounter(raw.counter, product.floorPrice, product.listPrice);

    const offerWithinBounds =
      offer >= product.floorPrice && offer <= product.listPrice;
    const deal = raw.deal && offerWithinBounds;

    if (raw.deal && !deal) {
      // Model tried to accept below the floor (prompt injection, bad luck).
      // Refuse, and make sure the visible counter can't leak the floor.
      counter =
        counter ??
        Math.round(((product.floorPrice + product.listPrice) / 2) * 100) / 100;
    }

    // A counter at or below the buyer's standing offer is not a negotiation,
    // it's a surrender. Keep Brindle above the offer unless he has accepted.
    if (!deal && counter !== null && counter <= offer) {
      counter = Math.min(
        product.listPrice,
        Math.round((offer + 1) * 100) / 100,
      );
    }

    if (deal) counter = null;

    const price = deal ? Math.round(Math.min(offer, product.listPrice) * 100) / 100 : null;

    let dealToken: string | null = null;
    let expiresAt: number | null = null;
    if (deal && price !== null) {
      const token = createDealToken(
        product.id,
        price,
        product.id === "merchant"
          ? {
              productName: product.name,
              floorPrice: product.floorPrice,
              listPrice: product.listPrice,
            }
          : undefined,
      );
      dealToken = token.token;
      expiresAt = token.expiresAt;
    }

    return NextResponse.json({
      reply: raw.reply,
      mood: raw.mood,
      counter,
      deal,
      price,
      dealToken,
      expiresAt,
      patience: snapshot.patience,
      round: snapshot.round,
      maxRounds: MAX_ROUNDS,
      buyerBest: snapshot.buyerBest,
      expelled: false,
    });
  } catch (error) {
    const reason =
      error instanceof BrindleUnavailableError ? error.reason : "failed";
    const fallback = fallbackReply(Date.now());

    console.error("[negotiate] Brindle unavailable:", reason, error);

    return NextResponse.json(
      {
        error: reason === "unconfigured" ? "model_unconfigured" : "model_error",
        reply: fallback.reply,
        mood: fallback.mood,
      },
      { status: 502 },
    );
  }
}
