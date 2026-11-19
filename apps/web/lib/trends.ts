import type { HospitalTrend, HourlyProfileCell } from "@quebec-urgences/shared";
import { PROFILE_MIN_SAMPLES, TREND_STABLE_POINTS } from "@quebec-urgences/shared";

// ─── Trend arrows ────────────────────────────────────────────────────────────

export type TrendDirection = "up" | "down" | "stable";

export interface TrendSummary {
  direction: TrendDirection;
  /** Percentage-point change, rounded (positive = fuller). */
  delta: number;
}

/** Summarise a trend, or null when either end of the comparison is missing. */
export function summarizeTrend(t: HospitalTrend | undefined): TrendSummary | null {
  if (!t || t.taux_now == null || t.taux_before == null) return null;
  const delta = Math.round(Number(t.taux_now) - Number(t.taux_before));
  if (Number.isNaN(delta)) return null;
  const direction: TrendDirection =
    Math.abs(delta) < TREND_STABLE_POINTS ? "stable" : delta > 0 ? "up" : "down";
  return { direction, delta };
}

/**
 * Build a HospitalTrend from an ascending hourly series (same rule as the
 * get_hospital_trends SQL: closest point at or before latest − hours,
 * within a 90-minute tolerance).
 */
export function trendFromSeries(
  series: { timestamp: string; taux_occupation: number | null }[],
  nomInstallation: string,
  hours: number
): HospitalTrend | undefined {
  const last = series[series.length - 1];
  if (!last) return undefined;
  const lastMs = new Date(last.timestamp).getTime();
  const target = lastMs - hours * 3_600_000;
  const floor = target - 90 * 60_000;
  for (let i = series.length - 1; i >= 0; i--) {
    const t = new Date(series[i].timestamp).getTime();
    if (t <= target) {
      if (t < floor) return undefined;
      return {
        nom_installation: nomInstallation,
        taux_now: last.taux_occupation,
        taux_before: series[i].taux_occupation,
        now_timestamp: last.timestamp,
        before_timestamp: series[i].timestamp,
      };
    }
  }
  return undefined;
}

// ─── Quebec local time ───────────────────────────────────────────────────────

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Weekday (0 = Sunday) and hour (0–23) of an instant in Quebec. */
export function quebecDowHour(date: Date): { dow: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  return { dow: WEEKDAY_INDEX[weekday] ?? 0, hour: hour % 24 };
}

/** Display order Monday → Sunday, with French labels. */
export const WEEK_ROWS: { dow: number; short: string; long: string }[] = [
  { dow: 1, short: "Lun", long: "lundi" },
  { dow: 2, short: "Mar", long: "mardi" },
  { dow: 3, short: "Mer", long: "mercredi" },
  { dow: 4, short: "Jeu", long: "jeudi" },
  { dow: 5, short: "Ven", long: "vendredi" },
  { dow: 6, short: "Sam", long: "samedi" },
  { dow: 0, short: "Dim", long: "dimanche" },
];

export function weekdayName(dow: number): string {
  return WEEK_ROWS.find((r) => r.dow === dow)?.long ?? "";
}

// ─── Hourly profile ──────────────────────────────────────────────────────────

/** Look up cells by `${dow}-${hour}`, keeping only those with enough samples. */
export function indexProfile(cells: HourlyProfileCell[]): Map<string, HourlyProfileCell> {
  const map = new Map<string, HourlyProfileCell>();
  for (const c of cells) {
    if (c.samples >= PROFILE_MIN_SAMPLES) map.set(`${c.dow}-${c.hour}`, c);
  }
  return map;
}

/**
 * The `count` hours of a given weekday with the lowest usual occupation,
 * in chronological order.
 */
export function calmestHours(
  profile: Map<string, HourlyProfileCell>,
  dow: number,
  count = 3
): HourlyProfileCell[] {
  const day: HourlyProfileCell[] = [];
  for (let h = 0; h < 24; h++) {
    const c = profile.get(`${dow}-${h}`);
    if (c) day.push(c);
  }
  return day
    .sort((a, b) => a.median_taux - b.median_taux)
    .slice(0, count)
    .sort((a, b) => a.hour - b.hour);
}
