-- Migration 004: Row Level Security — public read-only access
--
-- The dashboard reads with the public anon ("publishable") key, which ships
-- to every browser. Tables created via plain SQL have RLS disabled and Supabase
-- grants anon INSERT/UPDATE/DELETE by default, so without this migration anyone
-- with that key could write to or wipe the data.
--
-- After this migration:
--   - anon / authenticated: SELECT only
--   - service_role (ingestion script, Edge Function): unchanged — it bypasses RLS
--
-- Safe to re-run.

-- ─── Enable RLS ──────────────────────────────────────────────────────────────

ALTER TABLE urgences_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgences_daily_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_log          ENABLE ROW LEVEL SECURITY;

-- ─── Read-only policies ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read" ON urgences_snapshots;
CREATE POLICY "Public read" ON urgences_snapshots
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read" ON urgences_daily_rollups;
CREATE POLICY "Public read" ON urgences_daily_rollups
  FOR SELECT TO anon, authenticated USING (true);

-- Used by the status badge and /api/status.
DROP POLICY IF EXISTS "Public read" ON ingestion_log;
CREATE POLICY "Public read" ON ingestion_log
  FOR SELECT TO anon, authenticated USING (true);

-- ─── Belt and braces: drop write grants for public roles ─────────────────────

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON urgences_snapshots, urgences_daily_rollups, ingestion_log
  FROM anon, authenticated;

-- ─── View ────────────────────────────────────────────────────────────────────

-- Make the view evaluate RLS as the querying role rather than the view owner
-- (Postgres 15+), so it can never expose more than the base table allows.
ALTER VIEW urgences_latest SET (security_invoker = true);
GRANT SELECT ON urgences_latest TO anon, authenticated;

-- ─── Functions ───────────────────────────────────────────────────────────────

-- rollup_old_snapshots() deletes data; only the service role may call it.
REVOKE EXECUTE ON FUNCTION rollup_old_snapshots() FROM PUBLIC, anon, authenticated;
