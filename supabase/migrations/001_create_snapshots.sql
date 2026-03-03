-- Migration 001: Create urgences_snapshots and urgences_daily_rollups tables

-- ─── Hourly snapshots (retained for 60 days) ────────────────────────────────

CREATE TABLE IF NOT EXISTS urgences_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp                 TIMESTAMPTZ NOT NULL,
  nom_installation          TEXT NOT NULL,
  region                    TEXT NOT NULL,
  nb_civieres               INTEGER,
  nb_patients_civieres      INTEGER,
  taux_occupation           NUMERIC(6, 2),
  nb_patients_civieres_24h  INTEGER,
  nb_patients_civieres_48h  INTEGER,
  nb_personnes_presentes    INTEGER,
  nb_pec                    INTEGER,
  dms_ambulatoire           NUMERIC(8, 2),
  dms_civieres              NUMERIC(8, 2),

  CONSTRAINT uq_installation_timestamp UNIQUE (nom_installation, timestamp)
);

-- Index for time-range queries (charts, trend views)
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp
  ON urgences_snapshots (timestamp DESC);

-- Index for per-hospital queries
CREATE INDEX IF NOT EXISTS idx_snapshots_installation
  ON urgences_snapshots (nom_installation, timestamp DESC);

-- Index for regional aggregations
CREATE INDEX IF NOT EXISTS idx_snapshots_region
  ON urgences_snapshots (region, timestamp DESC);


-- ─── Daily rollups (aggregated data older than 60 days) ─────────────────────

CREATE TABLE IF NOT EXISTS urgences_daily_rollups (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                     DATE NOT NULL,
  nom_installation         TEXT NOT NULL,
  region                   TEXT NOT NULL,
  nb_civieres              INTEGER,
  avg_taux_occupation      NUMERIC(6, 2),
  max_taux_occupation      NUMERIC(6, 2),
  avg_nb_patients_civieres NUMERIC(6, 2),
  avg_nb_personnes_presentes NUMERIC(6, 2),
  snapshot_count           INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT uq_rollup_installation_date UNIQUE (nom_installation, date)
);

CREATE INDEX IF NOT EXISTS idx_rollups_date
  ON urgences_daily_rollups (date DESC);

CREATE INDEX IF NOT EXISTS idx_rollups_installation
  ON urgences_daily_rollups (nom_installation, date DESC);


-- ─── Ingestion log ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ingestion_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  row_count   INTEGER NOT NULL,
  inserted    INTEGER NOT NULL,
  skipped     INTEGER NOT NULL,
  errors      INTEGER NOT NULL DEFAULT 0,
  success     BOOLEAN NOT NULL DEFAULT TRUE,
  message     TEXT
);

CREATE INDEX IF NOT EXISTS idx_ingestion_log_fetched_at
  ON ingestion_log (fetched_at DESC);


-- ─── Convenience view: latest snapshot per installation ─────────────────────

CREATE OR REPLACE VIEW urgences_latest AS
SELECT DISTINCT ON (nom_installation)
  id,
  timestamp,
  nom_installation,
  region,
  nb_civieres,
  nb_patients_civieres,
  taux_occupation,
  nb_patients_civieres_24h,
  nb_patients_civieres_48h,
  nb_personnes_presentes,
  nb_pec,
  dms_ambulatoire,
  dms_civieres
FROM urgences_snapshots
ORDER BY nom_installation, timestamp DESC;
