import { NextResponse } from "next/server";
import { z } from "zod";

import { capturePayPalOrder, isPayPalConfigured, PayPalError } from "@/lib/paypal";

const BodySchema = z.object({
  orderId: z
    .string()
    .min(6)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: "paypal_unconfigured" }, { status: 503 });
  }

  try {
    const capture = await capturePayPalOrder(parsed.data.orderId);

    if (capture.status !== "COMPLETED" || !capture.captureId) {
      return NextResponse.json(
        { error: "capture_incomplete", status: capture.status },
        { status: 402 },
      );
    }

    return NextResponse.json(capture);
  } catch (error) {
    if (error instanceof PayPalError) {
      console.error("[paypal/capture-order]", error.status, error.detail);
      return NextResponse.json(
        { error: "paypal_error", detail: error.detail },
        { status: error.status >= 500 ? 502 : error.status },
      );
    }
    console.error("[paypal/capture-order] unexpected", error);
    return NextResponse.json({ error: "paypal_error" }, { status: 500 });
  }
}
