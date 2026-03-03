import { supabase } from "./supabase";
import type { UrgenceSnapshot, RegionSummary } from "@urgences-quebec/shared";

/**
 * Latest snapshot for every hospital (via the urgences_latest view).
 */
export async function getLatestSnapshots(): Promise<UrgenceSnapshot[]> {
  const { data, error } = await supabase
    .from("urgences_latest")
    .select("*")
    .order("taux_occupation", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
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
 */
export async function getRegionSummaries(): Promise<RegionSummary[]> {
  const latest = await getLatestSnapshots();

  const byRegion = new Map<string, { total: number; count: number; over100: number }>();

  for (const row of latest) {
    const prev = byRegion.get(row.region) ?? { total: 0, count: 0, over100: 0 };
    byRegion.set(row.region, {
      total: prev.total + (row.taux_occupation ?? 0),
      count: prev.count + 1,
      over100: prev.over100 + (row.taux_occupation >= 100 ? 1 : 0),
    });
  }

  return Array.from(byRegion.entries())
    .map(([region, { total, count, over100 }]) => ({
      region,
      avg_taux_occupation: Math.round((total / count) * 10) / 10,
      hospital_count: count,
      hospitals_over_100: over100,
    }))
    .sort((a, b) => b.avg_taux_occupation - a.avg_taux_occupation);
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
