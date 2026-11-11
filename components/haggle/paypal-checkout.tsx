"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AlertTriangle, Terminal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { CaptureSummary } from "./deal-card";

const ERROR_COPY: Record<string, string> = {
  paypal_unconfigured:
    "PayPal sandbox keys are missing. Add them to .env.local and restart the dev server.",
  deal_expired: "That contract expired. Brindle has reopened the haggle.",
  invalid_deal: "That contract didn't verify. Something has been tampered with.",
  price_out_of_bounds: "That price was outside the agreed bounds.",
  capture_incomplete: "PayPal didn't complete the capture. Nothing was charged.",
  paypal_error: "PayPal had a moment. Nothing was charged — try again.",
};

export default function PayPalCheckout({
  dealToken,
  price,
  onPaid,
}: {
  dealToken: string;
  price: number;
  onPaid: (capture: CaptureSummary) => void;
}) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-gold/20 bg-gold/[0.05] p-4">
        <div className="flex items-center gap-2 text-[12px] font-medium text-gold">
          <AlertTriangle className="h-3.5 w-3.5" />
          PayPal sandbox not configured
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">
          Create a sandbox app at developer.paypal.com, then set{" "}
          <code className="text-ink">PAYPAL_CLIENT_ID</code>,{" "}
          <code className="text-ink">PAYPAL_CLIENT_SECRET</code> and{" "}
          <code className="text-ink">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> in{" "}
          <code className="text-ink">.env.local</code>.
        </p>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-ink-muted/70">
          <Terminal className="h-3 w-3" /> the deal is still signed and waiting
        </div>
      </div>
    );
  }

  async function createOrder(): Promise<string> {
    setError(null);
    const response = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealToken }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
    };

    if (!response.ok || !data.id) {
      const message = ERROR_COPY[data.error ?? ""] ?? "Could not open the PayPal order.";
      setError(message);
      toast.error(message);
      throw new Error(message);
    }

    return data.id;
  }

  async function captureOrder(orderId: string) {
    setPaying(true);
    try {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        orderId?: string;
        captureId?: string;
        amount?: number;
        currency?: string;
        payerName?: string | null;
        error?: string;
      };

      if (!response.ok || !data.captureId) {
        const message =
          ERROR_COPY[data.error ?? ""] ?? "PayPal didn't complete the payment.";
        setError(message);
        toast.error(message);
        return;
      }

      onPaid({
        orderId: data.orderId ?? orderId,
        captureId: data.captureId,
        amount: data.amount ?? price,
        currency: data.currency ?? "USD",
        payerName: data.payerName ?? null,
      });
    } catch {
      setError("The capture request failed. Nothing was charged.");
      toast.error("The capture request failed. Nothing was charged.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-2" data-cursor-native>
      <PayPalScriptProvider
        options={{
          clientId,
          currency: "USD",
          intent: "capture",
          components: "buttons",
        }}
      >
        <PayPalButtons
          forceReRender={[dealToken]}
          style={{
            layout: "vertical",
            shape: "pill",
            label: "paypal",
            height: 46,
            tagline: false,
          }}
          createOrder={createOrder}
          onApprove={async (data) => {
            await captureOrder(data.orderID);
          }}
          onCancel={() => {
            toast.message("Payment cancelled. The deal is still open until it expires.");
          }}
          onError={() => {
            setError("PayPal ran into a problem. Nothing was charged.");
            toast.error("PayPal ran into a problem. Nothing was charged.");
          }}
        />
      </PayPalScriptProvider>

      {paying && (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
          capturing…
        </p>
      )}
      {error && (
        <p className="text-center text-[11px] leading-relaxed text-danger/90">{error}</p>
      )}
    </div>
  );
}
