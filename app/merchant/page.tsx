import type { Metadata } from "next";

import { MerchantPage } from "@/components/merchant/merchant-page";

export const metadata: Metadata = {
  title: "Merchant — Haggle Bot",
  description:
    "Set your prices, pick a personality. Brindle haggles for you — never below your floor.",
};

export default function Merchant() {
  return <MerchantPage />;
}
