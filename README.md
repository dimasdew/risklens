# RiskLens

Token risk scanner for Solana and EVM chains. Helps traders, communities, and builders check token risks before buying, promoting, or integrating.

**Live:** [risklens-labs.vercel.app](https://risklens-labs.vercel.app)

## What it does

Paste a contract address, choose a chain, get a plain-language risk report with score, warnings, and recommended action.

```text
Paste token address -> choose chain -> scan -> risk report + next action
```

Every scan generates a shareable report URL (`/report/{id}`).

## Features

**Scanner**
- Risk scoring: LOW, MEDIUM, HIGH, CRITICAL
- Solana mint/freeze authority, holder concentration checks
- EVM security: honeypot, taxes, ownership, proxy, blacklist (via GoPlus)
- DEX liquidity, volume, pair age detection (via DexScreener)
- Score breakdown, confidence label, data source transparency
- Actionable next steps: Avoid, Monitor, Check LP, Verify authority, etc.

**Auth & Accounts**
- Email/password authentication (Supabase Auth)
- Account-based scan history
- Account-based scan limits (logged-in users tracked by user_id)
- Forgot password / reset password flow
- Protected routes via proxy middleware

**Watchlist**
- Save tokens to personal watchlist
- Add/remove from report or dashboard
- Foundation for future alert system

**Pro Waitlist**
- Waitlist capture modal from pricing CTAs
- Stored in Supabase for demand validation

**Dashboard**
- Personal scan history
- Watchlist management
- Account info and actions

**UX**
- Responsive mobile nav (hamburger menu)
- Toast notification system
- Loading skeletons
- Custom 404 page
- SEO: sitemap.xml, robots.txt, OpenGraph meta
- Custom SVG favicon

## Supported Chains

- Solana
- Ethereum
- Base
- BNB Chain

## Setup

```bash
npm install
cp .env.example .env.local
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
npm test           # Run Vitest unit tests (65 tests)
```

## Environment Variables

```bash
# Data sources
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your-helius-api-key
MORALIS_API_KEY=your-moralis-api-key
ALCHEMY_API_KEY=your-alchemy-api-key

# Supabase (server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase (client-side, for auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`SUPABASE_SERVICE_ROLE_KEY` is used for server-side writes (reports, scan usage, waitlist, watchlist). Never expose it with a `NEXT_PUBLIC_` prefix.

## Data Sources

- **DexScreener:** token pair, liquidity, price, volume, pair age
- **Solana RPC:** mint account, token supply, largest accounts
- **Helius:** Solana recent transaction activity signals
- **Moralis:** EVM token holders and recent transfer activity signals
- **Alchemy:** EVM recent transfer activity fallback
- **GoPlus Security:** EVM owner, proxy, mint, tax, honeypot signals

## Architecture

```text
app/
  page.tsx                    # Landing page
  scan/page.tsx               # Scanner UI
  dashboard/page.tsx          # User dashboard
  login/page.tsx              # Login
  register/page.tsx           # Register
  forgot-password/page.tsx    # Forgot password
  reset-password/page.tsx     # Reset password
  report/[id]/page.tsx        # Shareable report page
  api/scan/route.ts           # Scan API
  api/reports/route.ts        # Reports listing API
  api/waitlist/route.ts       # Pro waitlist API
  api/watchlist/route.ts      # Watchlist CRUD API
  auth/callback/route.ts      # Supabase auth callback
  components/
    Navbar.tsx                # Auth-aware nav with hamburger
    AuthProvider.tsx          # Auth context
    Toast.tsx                 # Toast notification system
    Report.tsx                # Scan report with next actions
    PricingSection.tsx        # Pricing with waitlist modal
    WaitlistModal.tsx         # Waitlist signup form
lib/
  supabase-server.ts          # Shared server-side Supabase client
  supabase-browser.ts         # Client-side Supabase singleton
  data-sources.ts             # Data fetching integrations
  risk-engine.ts              # Scoring and warnings
  report-store.ts             # Report storage (Supabase + local fallback)
  scan-limit.ts               # Scan limit enforcement
  rate-limit.ts               # Burst rate limiter
  types.ts                    # Shared types
proxy.ts                      # Auth middleware (protected routes)
supabase/
  schema.sql                  # Initial schema
  migrations/
    002_waitlist_watchlist.sql # Waitlist, watchlist, RLS hardening
```

## Supabase Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Run `supabase/migrations/002_waitlist_watchlist.sql`
4. Enable email auth in Authentication > Providers
5. Set environment variables in `.env.local` and Vercel
6. Restart dev server

**RLS policies:**
- `scan_reports`: public read, service-role-only write
- `scan_usage`: service-role-only
- `waitlist_signups`: service-role-only
- `watchlist`: user can only access their own rows

## Business Model

- **Free:** 50 scans per day, shareable reports, scan history
- **Pro ($19/mo):** unlimited scans, token watchlist, alerts, advanced signals
- **Community/API (Custom):** Telegram bot, batch scans, API access, webhooks

## Roadmap

- v1: Web scanner + auth + waitlist ✅ (current)
- v2: Watchlist alerts (liquidity, authority, risk score changes)
- v3: Telegram bot for communities
- v4: Trending token risk feed
- v5: Public risk API for wallets, bots, dashboards

## Testing

65 unit tests covering risk engine, data sources, rate limiting, formatting, signals, and scan limits.

```bash
npm test
```

## Important

RiskLens is an automated scanner, not a full smart contract audit. Use it as a fast pre-check before deeper research.
