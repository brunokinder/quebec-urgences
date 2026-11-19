import {
  CRITICAL_OCCUPATION_THRESHOLD,
  HIGH_OCCUPATION_THRESHOLD,
  STALE_AFTER_HOURS,
} from "./constants";

export type OccupationLevel = "critical" | "high" | "normal" | "unknown";

/** Classify an occupation rate. A missing rate is "unknown", never "normal". */
export function occupationLevel(rate: number | null | undefined): OccupationLevel {
  if (rate == null || Number.isNaN(rate)) return "unknown";
  if (rate >= CRITICAL_OCCUPATION_THRESHOLD) return "critical";
  if (rate >= HIGH_OCCUPATION_THRESHOLD) return "high";
  return "normal";
}

/**
 * Mark snapshots whose timestamp lags the freshest one by more than
 * STALE_AFTER_HOURS. Measured against the dataset rather than "now" so a
 * pipeline outage (already shown by the status badge) doesn't flag everything.
 */
export function markStale<T extends { timestamp: string }>(rows: T[]): (T & { is_stale: boolean })[] {
  const times = rows.map((r) => new Date(r.timestamp).getTime()).filter((t) => !Number.isNaN(t));
  const newest = times.length ? Math.max(...times) : 0;
  const limitMs = STALE_AFTER_HOURS * 3_600_000;
  return rows.map((r) => {
    const t = new Date(r.timestamp).getTime();
    return { ...r, is_stale: Number.isNaN(t) || newest - t > limitMs };
  });
}

/** True when the snapshot has a usable, current occupation rate. */
export function hasCurrentRate(s: { taux_occupation: number | null; is_stale?: boolean }): boolean {
  return s.taux_occupation != null && !s.is_stale;
}
