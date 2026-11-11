import "server-only";

const API_BASE = (
  process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com"
).replace(/\/$/, "");

export class PayPalError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(`PayPal request failed (${status}): ${detail}`);
    this.name = "PayPalError";
    this.status = status;
    this.detail = detail;
  }
}

export function isPayPalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );
}

type CachedToken = { token: string; expiresAt: number };

const globalForPayPal = globalThis as unknown as {
  __hagglePayPalToken?: CachedToken;
};

async function readError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) return response.statusText || "no response body";
  try {
    const json = JSON.parse(text) as {
      error_description?: string;
      message?: string;
      details?: Array<{ issue?: string; description?: string }>;
      name?: string;
    };
    return (
      json.error_description ??
      json.message ??
      json.details?.[0]?.description ??
      json.name ??
      text.slice(0, 300)
    );
  } catch {
    return text.slice(0, 300);
  }
}

/** OAuth2 client_credentials token, cached in-process until shortly before expiry. */
export async function getAccessToken(force = false): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new PayPalError(503, "PayPal credentials are not configured");
  }

  const cached = globalForPayPal.__hagglePayPalToken;
  if (!force && cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const auth = Buffer.from(`${clientId}:${secret}`, "utf8").toString("base64");
  const response = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new PayPalError(response.status, await readError(response));
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new PayPalError(502, "PayPal did not return an access token");
  }

  const expiresIn = data.expires_in ?? 3000;
  globalForPayPal.__hagglePayPalToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return data.access_token;
}

export type PayPalOrder = { id: string; status: string };

export async function createPayPalOrder(input: {
  price: number;
  productId: string;
  productName: string;
}): Promise<PayPalOrder> {
  const token = await getAccessToken();

  const response = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `haggle-${crypto.randomUUID()}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.productId,
          description: input.productName.slice(0, 127),
          amount: {
            currency_code: "USD",
            value: input.price.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Haggle Bot",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new PayPalError(response.status, await readError(response));
  }

  const data = (await response.json()) as PayPalOrder;
  if (!data.id) throw new PayPalError(502, "PayPal order ID missing");
  return data;
}

export type PayPalCapture = {
  orderId: string;
  status: string;
  captureId: string;
  amount: number;
  currency: string;
  payerName: string | null;
};

type CaptureResponse = {
  id?: string;
  status?: string;
  payer?: {
    name?: { given_name?: string; surname?: string };
  };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { value?: string; currency_code?: string };
      }>;
    };
  }>;
};

export async function capturePayPalOrder(
  orderId: string,
): Promise<PayPalCapture> {
  const token = await getAccessToken();

  const response = await fetch(
    `${API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `haggle-capture-${orderId}`,
      },
      body: "{}",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new PayPalError(response.status, await readError(response));
  }

  const data = (await response.json()) as CaptureResponse;
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  const value = Number(capture?.amount?.value ?? "0");
  const name = data.payer?.name;
  const payerName =
    [name?.given_name, name?.surname].filter(Boolean).join(" ") || null;

  return {
    orderId: data.id ?? orderId,
    status: capture?.status ?? data.status ?? "UNKNOWN",
    captureId: capture?.id ?? "",
    amount: Number.isFinite(value) ? value : 0,
    currency: capture?.amount?.currency_code ?? "USD",
    payerName,
  };
}
