-- Waitlist signups table
CREATE TABLE IF NOT EXISTS waitlist_signups (
  email TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'pro',
  use_case TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  token_name TEXT,
  token_symbol TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

-- Add user_id column to scan_reports (nullable for anonymous scans)
ALTER TABLE scan_reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scan_reports_user_id ON scan_reports(user_id);

-- RLS policies for waitlist (server-only writes via service role)
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "waitlist_insert_service" ON waitlist_signups;
CREATE POLICY "waitlist_insert_service" ON waitlist_signups FOR ALL USING (false);

-- RLS policies for watchlist (users can only access their own)
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "watchlist_user_select" ON watchlist;
CREATE POLICY "watchlist_user_select" ON watchlist FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "watchlist_user_insert" ON watchlist;
CREATE POLICY "watchlist_user_insert" ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "watchlist_user_delete" ON watchlist;
CREATE POLICY "watchlist_user_delete" ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- Tighten scan_reports: only service role can insert/update, anyone can read
ALTER TABLE scan_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scan_reports_public_read" ON scan_reports;
CREATE POLICY "scan_reports_public_read" ON scan_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "scan_reports_service_write" ON scan_reports;
CREATE POLICY "scan_reports_service_write" ON scan_reports FOR ALL USING (false);

-- Tighten scan_usage: only service role can read/write
ALTER TABLE scan_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scan_usage_service_only" ON scan_usage;
CREATE POLICY "scan_usage_service_only" ON scan_usage FOR ALL USING (false);
