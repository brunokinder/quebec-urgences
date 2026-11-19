/**
 * Raw row as it comes from the MSSS CSV / CKAN API.
 */
export interface UrgenceRow {
  nom_installation: string;
  region: string;
  nb_civieres: number | null;
  nb_patients_civieres: number | null;
  /** Computed from occupied / functional stretchers; null when either is missing. */
  taux_occupation: number | null;
  nb_patients_civieres_24h: number | null;
  nb_patients_civieres_48h: number | null;
  nb_personnes_presentes: number | null;
  nb_pec: number | null;
  dms_ambulatoire: number | null;
  dms_civieres: number | null;
}

/**
 * A snapshot stored in the database (includes id + timestamp).
 */
export interface UrgenceSnapshot extends UrgenceRow {
  id: string;
  timestamp: string; // ISO 8601
  /**
   * Set by the web app: true when this hospital's latest report is much older
   * than the freshest report in the same batch (it has stopped reporting).
   */
  is_stale?: boolean;
}

/**
 * Daily rollup (aggregated from hourly snapshots older than 60 days).
 */
export interface UrgenceDailyRollup {
  id: string;
  date: string; // YYYY-MM-DD
  nom_installation: string;
  region: string;
  avg_taux_occupation: number;
  avg_nb_patients_civieres: number;
  avg_nb_personnes_presentes: number;
  max_taux_occupation: number;
  nb_civieres: number;
}

/**
 * Region summary — computed client-side or via a DB view.
 */
export interface RegionSummary {
  region: string;
  /** Average over hospitals with a current, known rate; null if none. */
  avg_taux_occupation: number | null;
  hospital_count: number;
  /** Hospitals included in the average (current data with a known rate). */
  reporting_count: number;
  hospitals_over_100: number;
}

/**
 * Ingestion result returned by scripts/ingest.ts
 */
export interface IngestResult {
  fetched_at: string;
  row_count: number;
  inserted: number;
  skipped: number;
  errors: number;
}
