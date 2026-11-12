import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyDealToken } from "@/lib/deal-token";
import { createPayPalOrder, isPayPalConfigured, PayPalError } from "@/lib/paypal";
import { getServerProduct } from "@/lib/products.server";

const BodySchema = z.object({
  dealToken: z.string().min(8).max(2048),
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

  const verified = verifyDealToken(parsed.data.dealToken);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.reason === "expired" ? "deal_expired" : "invalid_deal" },
      { status: verified.reason === "expired" ? 410 : 400 },
    );
  }

  const { productId, price } = verified.payload;

  // Merchant listings are signed with their own name and bounds, so the order
  // can be built without a catalogue entry and still rejects an impossible
  // price.
  let productName: string;
  let floorPrice: number;
  let listPrice: number;

  if (productId === "merchant") {
    if (
      !verified.payload.productName ||
      typeof verified.payload.floorPrice !== "number" ||
      typeof verified.payload.listPrice !== "number"
    ) {
      return NextResponse.json({ error: "invalid_deal" }, { status: 400 });
    }
    productName = verified.payload.productName;
    floorPrice = verified.payload.floorPrice;
    listPrice = verified.payload.listPrice;
  } else {
    const product = getServerProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "unknown_product" }, { status: 404 });
    }
    productName = product.name;
    floorPrice = product.floorPrice;
    listPrice = product.listPrice;
  }

  // Defence in depth: a valid signature over an impossible price is still
  // refused.
  if (price < floorPrice || price > listPrice) {
    return NextResponse.json({ error: "price_out_of_bounds" }, { status: 400 });
  }

  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: "paypal_unconfigured" }, { status: 503 });
  }

  try {
    // The amount comes only from the verified token — never the request body.
    const order = await createPayPalOrder({
      price,
      productId,
      productName,
    });

    return NextResponse.json({ id: order.id, price, productId });
  } catch (error) {
    if (error instanceof PayPalError) {
      console.error("[paypal/create-order]", error.status, error.detail);
      return NextResponse.json(
        { error: "paypal_error", detail: error.detail },
        { status: error.status >= 500 ? 502 : error.status },
      );
    }
    console.error("[paypal/create-order] unexpected", error);
    return NextResponse.json({ error: "paypal_error" }, { status: 500 });
  }
}
