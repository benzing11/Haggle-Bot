const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function usd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return usdFormatter.format(value);
}

/** Round to whole cents so we never send PayPal a value like 83.333333. */
export function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function shortId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function percent(value: number): number {
  return Math.round(value);
}
