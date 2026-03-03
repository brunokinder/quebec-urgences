/**
 * Raw row as it comes from the MSSS CSV / CKAN API.
 */
export interface UrgenceRow {
  nom_installation: string;
  region: string;
  nb_civieres: number;
  nb_patients_civieres: number;
  taux_occupation: number;
  nb_patients_civieres_24h: number;
  nb_patients_civieres_48h: number;
  nb_personnes_presentes: number;
  nb_pec: number;
  dms_ambulatoire: number;
  dms_civieres: number;
}

/**
 * A snapshot stored in the database (includes id + timestamp).
 */
export interface UrgenceSnapshot extends UrgenceRow {
  id: string;
  timestamp: string; // ISO 8601
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
  avg_taux_occupation: number;
  hospital_count: number;
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
