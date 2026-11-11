import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Haggle Bot — every price is a conversation",
  description:
    "A dark little shop where nothing has a fixed price. Haggle with Brindle, an AI shopkeeper, and pay exactly what you agree on with PayPal.",
  openGraph: {
    title: "Haggle Bot",
    description:
      "Every price is a conversation. Haggle with an AI shopkeeper and pay the agreed price with PayPal.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#111116",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#F4F1EA",
            },
          }}
        />
      </body>
    </html>
  );
}
