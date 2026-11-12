import { NextResponse } from "next/server";
import { z } from "zod";

import { askBrindleOpening, BrindleUnavailableError } from "@/lib/brindle";
import { PERSONALITY_IDS } from "@/lib/merchant";

export const FALLBACK_OPENING = "Ah, a fine item. Let's talk price.";

const BodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200).default(""),
  listPrice: z.number().finite().positive().max(100_000),
  personality: z.enum(PERSONALITY_IDS),
});

/** Small in-memory limiter, same spirit as /api/negotiate. */
const buckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 20;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ openingLine: FALLBACK_OPENING });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ openingLine: FALLBACK_OPENING });
  }

  if (isRateLimited(ip)) {
    return NextResponse.json({ openingLine: FALLBACK_OPENING });
  }

  try {
    const openingLine = await askBrindleOpening(parsed.data);
    return NextResponse.json({ openingLine });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[merchant/preview] falling back:",
        error instanceof Error ? error.message : error,
      );
    }
    if (!(error instanceof BrindleUnavailableError)) {
      console.error("[merchant/preview] unexpected", error);
    }
    // The preview is a nicety: always answer in Brindle's voice.
    return NextResponse.json({ openingLine: FALLBACK_OPENING });
  }
}
