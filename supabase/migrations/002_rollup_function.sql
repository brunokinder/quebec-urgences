-- Migration 002: Rollup function — aggregates hourly rows older than 60 days
-- into daily summaries, then deletes the originals.
-- Called weekly via GitHub Actions (or pg_cron if available).

CREATE OR REPLACE FUNCTION rollup_old_snapshots()
RETURNS TABLE(
  rolled_up_days  INTEGER,
  deleted_rows    INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_cutoff        DATE := CURRENT_DATE - INTERVAL '60 days';
  v_rolled_days   INTEGER := 0;
  v_deleted_rows  INTEGER := 0;
BEGIN
  -- 1. Aggregate hourly rows older than the cutoff into daily rollups
  INSERT INTO urgences_daily_rollups (
    date,
    nom_installation,
    region,
    nb_civieres,
    avg_taux_occupation,
    max_taux_occupation,
    avg_nb_patients_civieres,
    avg_nb_personnes_presentes,
    snapshot_count
  )
  SELECT
    DATE(timestamp)                           AS date,
    nom_installation,
    region,
    MAX(nb_civieres)                          AS nb_civieres,
    ROUND(AVG(taux_occupation)::NUMERIC, 2)  AS avg_taux_occupation,
    MAX(taux_occupation)                      AS max_taux_occupation,
    ROUND(AVG(nb_patients_civieres)::NUMERIC, 2) AS avg_nb_patients_civieres,
    ROUND(AVG(nb_personnes_presentes)::NUMERIC, 2) AS avg_nb_personnes_presentes,
    COUNT(*)                                  AS snapshot_count
  FROM urgences_snapshots
  WHERE DATE(timestamp) < v_cutoff
  GROUP BY DATE(timestamp), nom_installation, region
  ON CONFLICT (nom_installation, date) DO NOTHING;

  GET DIAGNOSTICS v_rolled_days = ROW_COUNT;

  -- 2. Delete the original hourly rows that have been rolled up
  DELETE FROM urgences_snapshots
  WHERE DATE(timestamp) < v_cutoff;

  GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;

  RETURN QUERY SELECT v_rolled_days, v_deleted_rows;
END;
$$;
