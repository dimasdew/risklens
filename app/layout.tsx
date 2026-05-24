import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RiskLens — Token Risk Scanner for Solana & EVM",
    template: "%s — RiskLens"
  },
  description: "Scan any token before you trade. RiskLens checks liquidity, authorities, honeypot signals, taxes, and holder concentration across Solana, Ethereum, Base, and BNB Chain.",
  openGraph: {
    title: "RiskLens — Token Risk Scanner for Solana & EVM",
    description: "Scan any token before you trade. Free automated risk reports with plain-language warnings.",
    type: "website",
    siteName: "RiskLens"
  },
  twitter: {
    card: "summary_large_image",
    title: "RiskLens — Token Risk Scanner",
    description: "Assess token risk before you trade. Free for Solana & EVM."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
