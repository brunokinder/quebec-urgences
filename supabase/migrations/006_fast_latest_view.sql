-- Migration 006: make urgences_latest fast on a cold cache
--
-- The original view used DISTINCT ON over the whole urgences_snapshots table.
-- Postgres has no skip scan, so it read every snapshot ever stored (~100
-- hospitals × 24 rows a day) to keep one row per hospital. On a cold cache that
-- could take longer than Supabase's 3 s statement_timeout for the anon role,
-- which made the home page fail on the first visit and work on refresh.
--
-- This version walks the (nom_installation, timestamp DESC) index instead:
--   1. a recursive CTE jumps from one hospital name to the next
--      (a "loose index scan": one index probe per hospital), then
--   2. a LATERAL subquery fetches each hospital's newest row (one more probe).
-- About 2 × ~200 index lookups, whatever the size of the table. Hospitals that
-- stopped reporting are still returned (the app marks them stale), exactly as
-- before.
--
-- Same columns in the same order, so CREATE OR REPLACE works and the
-- get_hospital_trends() function from migration 005 keeps working.
--
-- Safe to re-run.

-- Relied on by both steps; already created by migration 001.
CREATE INDEX IF NOT EXISTS idx_snapshots_installation
  ON urgences_snapshots (nom_installation, timestamp DESC);

CREATE OR REPLACE VIEW urgences_latest
WITH (security_invoker = true) AS
WITH RECURSIVE hospitals AS (
  (
    SELECT nom_installation
    FROM urgences_snapshots
    ORDER BY nom_installation
    LIMIT 1
  )
  UNION ALL
  SELECT (
    SELECT s.nom_installation
    FROM urgences_snapshots s
    WHERE s.nom_installation > h.nom_installation
    ORDER BY s.nom_installation
    LIMIT 1
  )
  FROM hospitals h
  WHERE h.nom_installation IS NOT NULL
)
SELECT
  l.id,
  l.timestamp,
  l.nom_installation,
  l.region,
  l.nb_civieres,
  l.nb_patients_civieres,
  l.taux_occupation,
  l.nb_patients_civieres_24h,
  l.nb_patients_civieres_48h,
  l.nb_personnes_presentes,
  l.nb_pec,
  l.dms_ambulatoire,
  l.dms_civieres
FROM hospitals h
CROSS JOIN LATERAL (
  SELECT *
  FROM urgences_snapshots s
  WHERE s.nom_installation = h.nom_installation
  ORDER BY s.timestamp DESC
  LIMIT 1
) l
WHERE h.nom_installation IS NOT NULL;

GRANT SELECT ON urgences_latest TO anon, authenticated;
