# RiskLens

RiskLens is a new token risk scanner for Solana and EVM. It helps traders, communities, and builders check token risks before buying, promoting, or integrating a new asset.

Tagline:

```text
See the risk before you ape.
```

RiskLens turns technical token signals into a plain-language report: risk score, warnings, impact, and recommended action.

## MVP Flow

```text
Paste token address -> choose chain -> scan -> plain-language risk report
```

After a scan, RiskLens also creates a shareable report URL:

```text
/report/{reportId}
```

## Features

- Token risk score: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Solana mint authority and freeze authority checks
- Solana largest holder concentration checks
- EVM token security checks through GoPlus
- DEX liquidity, volume, pair age, and pair detection through DexScreener
- Local risk scoring engine
- Plain-language warnings and recommendations
- No wallet connection required
- Shareable report pages

## Supported Chains

- Solana
- Base
- BNB Chain
- Ethereum

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev        # Start local development server
npm run build      # Build production app
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
```

## Environment

Copy `.env.example` to `.env.local` if you want to use a custom Solana RPC.

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Data Sources

- DexScreener: token pair, liquidity, price, volume, pair age
- Solana RPC: mint account, token supply, largest accounts
- GoPlus Security: EVM token owner, proxy, mint, tax, honeypot signals

## Architecture

```text
app/
  api/scan/route.ts      # Scan API
  report/[id]/page.tsx   # Shareable report page
  page.tsx               # Scanner UI
lib/
  data-sources.ts        # DexScreener, Solana RPC, GoPlus integrations
  risk-engine.ts         # Local scoring and warnings
  report-store.ts        # Local JSON report storage
  types.ts               # Shared types
```

Reports are stored locally in `.data/reports` during MVP development. This folder is ignored by Git.

## Business Model Direction

- Free scanner for growth
- Pro watchlist and alerts for active traders
- Telegram bot subscription for crypto communities
- API access for wallets, bots, dashboards, and launchpads
- Paid audit-lite reports for indie token teams

## Product Direction

RiskLens should grow into a Web3 security toolkit for token traders and communities:

- v1: web scanner
- v2: token watchlist and alerts
- v3: Telegram bot for communities
- v4: trending token risk feed
- v5: risk API for wallets, bots, and dashboards

## Important Note

RiskLens is an automated scanner, not a full smart contract audit. Use it as a fast pre-check before deeper due diligence.
