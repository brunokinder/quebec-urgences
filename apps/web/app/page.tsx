import { getLatestSnapshots, getRegionSummaries, getLastIngestion } from "@/lib/queries";
import { RegionCard } from "@/components/RegionCard";
import { HospitalTable } from "@/components/HospitalTable";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [snapshots, regions, lastIngestion] = await Promise.all([
    getLatestSnapshots(),
    getRegionSummaries(),
    getLastIngestion(),
  ]);

  return (
    <div className="space-y-8">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tableau de bord</h2>
          <p className="text-sm text-gray-500">{snapshots.length} installations — données mises à jour chaque heure</p>
        </div>
        <StatusBadge lastIngestion={lastIngestion} />
      </div>

      {/* Regional overview */}
      <section>
        <h3 className="text-base font-semibold mb-3 text-gray-700 uppercase tracking-wide text-xs">
          Sommaire par région
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {regions.map((region) => (
            <RegionCard key={region.region} region={region} />
          ))}
        </div>
      </section>

      {/* Full hospital table */}
      <section>
        <h3 className="text-base font-semibold mb-3 text-gray-700 uppercase tracking-wide text-xs">
          Toutes les installations
        </h3>
        <HospitalTable snapshots={snapshots} />
      </section>
    </div>
  );
}
