import crypto from "node:crypto";

import { z } from "zod";

const PayloadSchema = z.object({
  v: z.literal(1),
  productId: z.string().min(1).max(64),
  price: z.number().finite().positive().max(100_000),
  exp: z.number().int().positive(),
  jti: z.string().min(8).max(64),
  /** Merchant listings carry their own signed name and bounds. */
  productName: z.string().min(1).max(80).optional(),
  floorPrice: z.number().finite().positive().max(100_000).optional(),
  listPrice: z.number().finite().positive().max(100_000).optional(),
});

export type DealPayload = z.infer<typeof PayloadSchema>;

export const DEAL_TTL_MS = 10 * 60 * 1000;

function signingSecret(): Buffer {
  const secret = process.env.DEAL_SIGNING_SECRET;
  if (secret && secret.length >= 16) return Buffer.from(secret, "utf8");

  if (process.env.NODE_ENV !== "production") {
    // Local development convenience only. Production fails closed.
    return Buffer.from("haggle-bot-local-development-signing-key", "utf8");
  }

  throw new Error("DEAL_SIGNING_SECRET is missing or too short (min 16 chars).");
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", signingSecret())
    .update(payload)
    .digest("base64url");
}

export function createDealToken(
  productId: string,
  price: number,
  options: {
    ttlMs?: number;
    productName?: string;
    floorPrice?: number;
    listPrice?: number;
  } = {},
): { token: string; expiresAt: number } {
  const ttlMs = options.ttlMs ?? DEAL_TTL_MS;
  const expiresAt = Date.now() + ttlMs;
  const payload: DealPayload = {
    v: 1,
    productId,
    price: Math.round(price * 100) / 100,
    exp: expiresAt,
    jti: crypto.randomUUID(),
    ...(options.productName ? { productName: options.productName } : {}),
    ...(typeof options.floorPrice === "number"
      ? { floorPrice: options.floorPrice }
      : {}),
    ...(typeof options.listPrice === "number"
      ? { listPrice: options.listPrice }
      : {}),
  };

  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return { token: `${encoded}.${sign(encoded)}`, expiresAt };
}

export type VerifyResult =
  | { ok: true; payload: DealPayload }
  | { ok: false; reason: "malformed" | "invalid" | "expired" };

export function verifyDealToken(token: string): VerifyResult {
  if (typeof token !== "string" || token.length > 2048) {
    return { ok: false, reason: "malformed" };
  }

  const [encoded, signature, ...rest] = token.split(".");
  if (!encoded || !signature || rest.length > 0) {
    return { ok: false, reason: "malformed" };
  }

  let expected: string;
  try {
    expected = sign(encoded);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const provided = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (
    provided.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(provided, expectedBuffer)
  ) {
    return { ok: false, reason: "invalid" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const result = PayloadSchema.safeParse(parsed);
  if (!result.success) return { ok: false, reason: "malformed" };

  if (result.data.exp <= Date.now()) return { ok: false, reason: "expired" };

  return { ok: true, payload: result.data };
}
