-- Migration 005: Trend and "usual level" functions for the dashboard
--
--   get_hospital_trends(p_hours)          latest rate vs the rate p_hours earlier,
--                                         for every installation (cards' ↑/↓ arrow)
--   get_hospital_hourly_profile(name, n)  median rate per weekday × hour over the
--                                         last n weeks (hospital page heat map and
--                                         "usually X% at this hour")
--
-- Both are read-only, SECURITY INVOKER (RLS from migration 004 applies) and
-- callable with the public anon key. Requires hourly history, so keep the
-- rollup (002) from deleting recent weeks. Safe to re-run.

-- ─── Trend: now vs p_hours ago ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_hospital_trends(p_hours integer DEFAULT 3)
RETURNS TABLE (
  nom_installation  text,
  taux_now          numeric,
  taux_before       numeric,
  now_timestamp     timestamptz,
  before_timestamp  timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    l.nom_installation,
    l.taux_occupation,
    b.taux_occupation,
    l.timestamp,
    b.timestamp
  FROM urgences_latest l
  CROSS JOIN LATERAL (
    -- Closest snapshot at or before (latest − p_hours), tolerating a missed
    -- hour or two so one gap in the feed doesn't hide the trend.
    SELECT s.taux_occupation, s.timestamp
    FROM urgences_snapshots s
    WHERE s.nom_installation = l.nom_installation
      AND s.timestamp <= l.timestamp - make_interval(hours => p_hours)
      AND s.timestamp >= l.timestamp - make_interval(hours => p_hours) - interval '90 minutes'
    ORDER BY s.timestamp DESC
    LIMIT 1
  ) b;
$$;

-- ─── Weekly profile: median per weekday × hour (Quebec local time) ──────────

CREATE OR REPLACE FUNCTION get_hospital_hourly_profile(
  p_installation text,
  p_weeks        integer DEFAULT 8
)
RETURNS TABLE (
  dow          integer,  -- 0 = Sunday … 6 = Saturday (Postgres EXTRACT(DOW))
  hour         integer,  -- 0–23, America/Toronto
  median_taux  numeric,
  samples      integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    EXTRACT(DOW  FROM s.timestamp AT TIME ZONE 'America/Toronto')::integer,
    EXTRACT(HOUR FROM s.timestamp AT TIME ZONE 'America/Toronto')::integer,
    ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY s.taux_occupation)::numeric, 1),
    COUNT(*)::integer
  FROM urgences_snapshots s
  WHERE s.nom_installation = p_installation
    AND s.taux_occupation IS NOT NULL
    AND s.timestamp >= now() - make_interval(weeks => p_weeks)
    -- Leave out the last 24 h so "usual" isn't partly today's own numbers.
    AND s.timestamp <  now() - interval '24 hours'
  GROUP BY 1, 2;
$$;

-- ─── Access ──────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION get_hospital_trends(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_hospital_hourly_profile(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_hospital_trends(integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_hospital_hourly_profile(text, integer) TO anon, authenticated, service_role;
