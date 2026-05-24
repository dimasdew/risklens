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
  created_at timestamptz not null default now()
);

create index if not exists scan_reports_created_at_idx on scan_reports (created_at desc);
create index if not exists scan_reports_chain_address_idx on scan_reports (chain, lower(address));

alter table scan_reports enable row level security;

drop policy if exists "Public can read scan reports" on scan_reports;
create policy "Public can read scan reports"
  on scan_reports
  for select
  to anon
  using (true);

drop policy if exists "Public can insert scan reports" on scan_reports;
create policy "Public can insert scan reports"
  on scan_reports
  for insert
  to anon
  with check (
    char_length(id) = 16
    and created_at >= now() - interval '5 minutes'
  );

-- Remove public update policy: reports are immutable once created.
-- Only server-side (service_role) should update if needed.
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

drop policy if exists "Public can read scan usage" on scan_usage;
create policy "Public can read scan usage"
  on scan_usage
  for select
  to anon
  using (true);

drop policy if exists "Public can insert scan usage" on scan_usage;
create policy "Public can insert scan usage"
  on scan_usage
  for insert
  to anon
  with check (
    usage_date = current_date
    and scan_count >= 0
    and scan_count <= 200
  );

drop policy if exists "Public can update scan usage" on scan_usage;
create policy "Public can update scan usage"
  on scan_usage
  for update
  to anon
  using (usage_date = current_date)
  with check (
    scan_count >= 0
    and scan_count <= 200
  );
