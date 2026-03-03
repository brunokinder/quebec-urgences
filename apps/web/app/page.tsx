import { getLatestSnapshots, getRegionSummaries, getLastIngestion } from "@/lib/queries";
import { RegionCard } from "@/components/RegionCard";
import { HospitalTable } from "@/components/HospitalTable";
import { StatusBadge } from "@/components/StatusBadge";
import HospitalMapWrapper from "@/components/HospitalMapWrapper";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [snapshots, regions, lastIngestion] = await Promise.all([
    getLatestSnapshots(),
    getRegionSummaries(),
    getLastIngestion(),
  ]);

  const criticalCount = snapshots.filter((s) => (s.taux_occupation ?? 0) >= 100).length;
  const highCount = snapshots.filter(
    (s) => (s.taux_occupation ?? 0) >= 80 && (s.taux_occupation ?? 0) < 100
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50 tracking-tight">Tableau de bord</h2>
          <p className="text-sm text-slate-500 mt-1">
            {snapshots.length} installations — données mises à jour chaque heure
          </p>
          {/* Quick stats */}
          <div className="flex items-center gap-4 mt-3">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {criticalCount} inst. critiques (&gt;100%)
              </span>
            )}
            {highCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {highCount} inst. surchargées (&gt;80%)
              </span>
            )}
          </div>
        </div>
        <StatusBadge lastIngestion={lastIngestion} />
      </div>

      {/* Regional overview */}
      <section>
        <h3 className="text-xs font-semibold mb-4 text-slate-500 uppercase tracking-widest">
          Sommaire par région
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
          {regions.map((region) => (
            <RegionCard key={region.region} region={region} />
          ))}
        </div>
      </section>

      {/* Map */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Carte des urgences
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-80" />
              &lt; 80%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-80" />
              80–100%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-80" />
              &gt; 100%
            </span>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-surface-border" style={{ height: 520 }}>
          <HospitalMapWrapper snapshots={snapshots} />
        </div>
      </section>

      {/* Full hospital table */}
      <section>
        <h3 className="text-xs font-semibold mb-4 text-slate-500 uppercase tracking-widest">
          Toutes les installations
        </h3>
        <HospitalTable snapshots={snapshots} />
      </section>
    </div>
  );
}
