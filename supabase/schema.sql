create table if not exists scan_reports (
  id text primary key,
  chain text not null,
  address text not null,
  token_name text,
  token_symbol text,
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
  with check (true);

drop policy if exists "Public can update same scan report id" on scan_reports;
create policy "Public can update same scan report id"
  on scan_reports
  for update
  to anon
  using (true)
  with check (true);
