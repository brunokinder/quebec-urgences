// Data source URLs live in supabase/functions/_shared/urgences.ts (the
// ingestion core shared by the Node script and the Edge Function).

/** Keep hourly rows for this many days, then roll up into daily averages. */
export const HOURLY_RETENTION_DAYS = 60;

/** Occupation rate threshold considered critical. */
export const CRITICAL_OCCUPATION_THRESHOLD = 100;

/** Occupation rate threshold considered high. */
export const HIGH_OCCUPATION_THRESHOLD = 80;

/**
 * A hospital whose latest report is this many hours older than the freshest
 * report in the dataset is considered stale (it has stopped reporting).
 */
export const STALE_AFTER_HOURS = 3;

/** Trend arrows compare the latest rate with the rate this many hours earlier. */
export const TREND_WINDOW_HOURS = 3;

/** Changes smaller than this (percentage points) are shown as "stable". */
export const TREND_STABLE_POINTS = 5;

/** Weeks of history used for the "usual level" profile. */
export const PROFILE_WEEKS = 8;

/** Minimum snapshots for a weekday × hour cell to count as "usual". */
export const PROFILE_MIN_SAMPLES = 3;
