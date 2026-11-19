import { supabase } from "./supabase";
import type { UrgenceSnapshot, RegionSummary } from "@quebec-urgences/shared";
import { CRITICAL_OCCUPATION_THRESHOLD, hasCurrentRate, markStale } from "@quebec-urgences/shared";

/**
 * Latest snapshot for every hospital (via the urgences_latest view).
 * Each row gets `is_stale` when that hospital has stopped reporting.
 * Sorted by occupation (highest first), unknown rates last.
 */
export async function getLatestSnapshots(): Promise<UrgenceSnapshot[]> {
  const { data, error } = await supabase
    .from("urgences_latest")
    .select("*")
    .order("taux_occupation", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return markStale((data ?? []) as UrgenceSnapshot[]);
}

/**
 * Hourly trend for a single hospital over the past N days.
 */
export async function getHospitalTrend(
  nomInstallation: string,
  days = 7
): Promise<UrgenceSnapshot[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("urgences_snapshots")
    .select("*")
    .eq("nom_installation", nomInstallation)
    .gte("timestamp", since.toISOString())
    .order("timestamp", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Regional summary — computed from latest snapshots.
 * Only hospitals with a current, known rate count toward the average;
 * stale or missing rates are excluded instead of being treated as 0%.
 */
export async function getRegionSummaries(snapshots?: UrgenceSnapshot[]): Promise<RegionSummary[]> {
  const latest = snapshots ?? (await getLatestSnapshots());

  const byRegion = new Map<string, { total: number; reporting: number; count: number; over100: number }>();

  for (const row of latest) {
    const prev = byRegion.get(row.region) ?? { total: 0, reporting: 0, count: 0, over100: 0 };
    prev.count += 1;
    if (hasCurrentRate(row)) {
      const rate = row.taux_occupation as number;
      prev.total += rate;
      prev.reporting += 1;
      if (rate >= CRITICAL_OCCUPATION_THRESHOLD) prev.over100 += 1;
    }
    byRegion.set(row.region, prev);
  }

  return Array.from(byRegion.entries())
    .map(([region, { total, reporting, count, over100 }]) => ({
      region,
      avg_taux_occupation: reporting > 0 ? Math.round((total / reporting) * 10) / 10 : null,
      hospital_count: count,
      reporting_count: reporting,
      hospitals_over_100: over100,
    }))
    .sort((a, b) => (b.avg_taux_occupation ?? -1) - (a.avg_taux_occupation ?? -1));
}

/**
 * Last successful ingestion timestamp.
 */
export async function getLastIngestion(): Promise<{ fetched_at: string; inserted: number } | null> {
  const { data, error } = await supabase
    .from("ingestion_log")
    .select("fetched_at, inserted")
    .eq("success", true)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}
