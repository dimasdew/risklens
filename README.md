# RiskLens

RiskLens is a new token risk scanner for Solana and EVM. It helps traders, communities, and builders check token risks before buying, promoting, or integrating a new asset.

Tagline:

```text
Assess token risk before you trade.
```

RiskLens turns technical token signals into a plain-language report: risk score, warnings, impact, and recommended action.

## Product Flow

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
- Score breakdown and data confidence label
- Free plan scan limit: 50 scans per device per day
- No wallet connection required
- Shareable report pages
- Supabase report storage with local JSON fallback

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

Copy `.env.example` to `.env.local` if you want to use a custom Solana RPC or Supabase storage.

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your-helius-api-key
MORALIS_API_KEY=your-moralis-api-key
ALCHEMY_API_KEY=your-alchemy-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

You can also use `SUPABASE_SERVICE_ROLE_KEY` server-side instead of `SUPABASE_PUBLISHABLE_KEY`. Do not expose a service role key with a `NEXT_PUBLIC_` prefix.

## Data Sources

- DexScreener: token pair, liquidity, price, volume, pair age
- Solana RPC: mint account, token supply, largest accounts
- Helius: Solana recent transaction activity signals
- Moralis: EVM token holders and recent transfer activity signals
- Alchemy: EVM recent transfer activity fallback/enrichment
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
  report-store.ts        # Supabase report storage with local fallback
  scan-limit.ts          # Free scan limit enforcement
  types.ts               # Shared types
supabase/
  schema.sql             # Database schema
```

Reports and free scan usage are stored in Supabase when `SUPABASE_URL` and a Supabase key are configured. If not configured, RiskLens falls back to local storage. Local storage is ignored by Git.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Add these variables to `.env.local`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

5. Restart `npm run dev`.

The initial schema enables public read/insert/update policies for scan reports so the publishable key can store shared reports. For production, tighten this with rate limits, server-side writes, abuse protection, and user-scoped policies.

Storage tables:

```sql
create table scan_reports (
  id text primary key,
  chain text not null,
  address text not null,
  token_name text,
  token_symbol text,
  risk_level text not null,
  score integer not null,
  liquidity_usd numeric,
  report jsonb not null,
  created_at timestamptz not null default now()
);

create table scan_usage (
  id text primary key,
  identifier_hash text not null,
  usage_date date not null,
  scan_count integer not null default 0,
  updated_at timestamptz not null default now()
);
```

## Business Model Direction

- Free scanner for growth: 50 scans per device per day
- Pro plan: unlimited scans, token watchlist, risk change alerts, advanced wallet activity signals
- Community plan: Telegram group bot, batch scans, moderation-oriented warning thresholds
- API plan: risk score endpoint, batch scans, webhooks for wallets, bots, dashboards, and launchpads
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
