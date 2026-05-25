-- ============================================================
-- scan_reports: stores shareable risk report results
-- ============================================================

create table if not exists scan_reports (
  id text primary key,
  chain text not null check (chain in ('solana', 'base', 'bsc', 'ethereum')),
  address text not null check (char_length(address) between 1 and 64),
  token_name text check (token_name is null or char_length(token_name) <= 200),
  token_symbol text check (token_symbol is null or char_length(token_symbol) <= 20),
  risk_level text not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  score integer not null check (score >= 0 and score <= 100),
  liquidity_usd numeric,
  report jsonb not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table scan_reports add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists scan_reports_created_at_idx on scan_reports (created_at desc);
create index if not exists scan_reports_chain_address_idx on scan_reports (chain, lower(address));
create index if not exists scan_reports_user_created_at_idx on scan_reports (user_id, created_at desc);

alter table scan_reports enable row level security;

drop policy if exists "Public can read scan reports" on scan_reports;
create policy "Public can read scan reports"
  on scan_reports
  for select
  to anon
  using (true);

-- scan_reports writes are managed exclusively via service_role.
drop policy if exists "Public can insert scan reports" on scan_reports;
drop policy if exists "Public can update same scan report id" on scan_reports;

-- ============================================================
-- scan_usage: tracks daily free scan limits per device/IP
-- ============================================================

create table if not exists scan_usage (
  id text primary key,
  identifier_hash text not null check (char_length(identifier_hash) = 64),
  usage_date date not null,
  scan_count integer not null default 0 check (scan_count >= 0 and scan_count <= 200),
  updated_at timestamptz not null default now()
);

create index if not exists scan_usage_date_idx on scan_usage (usage_date desc);
create index if not exists scan_usage_identifier_date_idx on scan_usage (identifier_hash, usage_date);

alter table scan_usage enable row level security;

-- scan_usage is managed exclusively via service_role.
-- No anon/authenticated policies: only service_role bypasses RLS.
drop policy if exists "Public can read scan usage" on scan_usage;
drop policy if exists "Public can insert scan usage" on scan_usage;
drop policy if exists "Public can update scan usage" on scan_usage;

-- Atomic increment function to avoid read-then-write race conditions.
create or replace function increment_scan_usage(
  p_id text,
  p_identifier_hash text,
  p_usage_date date,
  p_limit integer default 50
)
returns table(allowed boolean, scan_count integer) as $$
declare
  current_count integer;
begin
  insert into scan_usage (id, identifier_hash, usage_date, scan_count, updated_at)
  values (p_id, p_identifier_hash, p_usage_date, 1, now())
  on conflict (id) do update
    set scan_count = scan_usage.scan_count + 1,
        updated_at = now()
    where scan_usage.scan_count < p_limit
  returning scan_usage.scan_count into current_count;

  if current_count is null then
    select su.scan_count into current_count from scan_usage su where su.id = p_id;
    return query select false, current_count;
  else
    return query select true, current_count;
  end if;
end;
$$ language plpgsql;

-- ============================================================
-- waitlist_signups: captures pricing and product interest
-- ============================================================

create table if not exists waitlist_signups (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  plan text not null default 'pro' check (char_length(plan) <= 50),
  use_case text check (use_case is null or char_length(use_case) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists waitlist_signups_created_at_idx on waitlist_signups (created_at desc);

alter table waitlist_signups enable row level security;

-- waitlist_signups is managed exclusively via service_role.
-- No anon/authenticated policies.
drop policy if exists "Public can insert waitlist signups" on waitlist_signups;
drop policy if exists "Public can update own waitlist signup" on waitlist_signups;

-- ============================================================
-- watchlist: authenticated user token watchlist
-- ============================================================

create table if not exists watchlist (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  chain text not null check (chain in ('solana', 'base', 'bsc', 'ethereum')),
  address text not null check (char_length(address) between 1 and 64),
  token_name text check (token_name is null or char_length(token_name) <= 200),
  token_symbol text check (token_symbol is null or char_length(token_symbol) <= 20),
  created_at timestamptz not null default now(),
  unique (user_id, chain, address)
);

create index if not exists watchlist_user_created_at_idx on watchlist (user_id, created_at desc);

alter table watchlist enable row level security;

drop policy if exists "Users can read own watchlist" on watchlist;
create policy "Users can read own watchlist"
  on watchlist
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own watchlist" on watchlist;
create policy "Users can insert own watchlist"
  on watchlist
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own watchlist" on watchlist;
create policy "Users can delete own watchlist"
  on watchlist
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── Watchlist events (lazy-evaluated score changes) ──────────────────
create table if not exists watchlist_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  chain text not null,
  address text not null,
  event_type text not null default 'score_change',
  previous_score integer,
  new_score integer,
  previous_risk_level text,
  new_risk_level text,
  detected_at timestamptz default now(),
  dismissed boolean default false
);

create index if not exists idx_watchlist_events_user on watchlist_events(user_id, dismissed, detected_at desc);

alter table watchlist_events enable row level security;

drop policy if exists "Users can read own events" on watchlist_events;
create policy "Users can read own events"
  on watchlist_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update own events" on watchlist_events;
create policy "Users can update own events"
  on watchlist_events
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── User tiers (free / pro / admin) ──────────────────────────────────
create table if not exists user_tiers (
  user_id uuid primary key,
  tier text not null default 'free' check (tier in ('free', 'pro', 'admin')),
  scan_limit integer not null default 50,
  updated_at timestamptz default now()
);

alter table user_tiers enable row level security;

drop policy if exists "Users can read own tier" on user_tiers;
create policy "Users can read own tier"
  on user_tiers
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ─── User profiles ──────────────────────────────────────────────────────
create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  updated_at timestamptz default now(),
  unique (username)
);

alter table user_profiles enable row level security;

drop policy if exists "Users can read own profile" on user_profiles;
create policy "Users can read own profile"
  on user_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on user_profiles;
create policy "Users can update own profile"
  on user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on user_profiles;
create policy "Users can insert own profile"
  on user_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);
