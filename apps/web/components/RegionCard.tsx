import type { RegionSummary } from "@urgences-quebec/shared";
import { CRITICAL_OCCUPATION_THRESHOLD, HIGH_OCCUPATION_THRESHOLD } from "@urgences-quebec/shared";

interface Props {
  region: RegionSummary;
}

export function RegionCard({ region }: Props) {
  const rate = region.avg_taux_occupation;
  const barColor =
    rate >= CRITICAL_OCCUPATION_THRESHOLD
      ? "bg-red-500"
      : rate >= HIGH_OCCUPATION_THRESHOLD
      ? "bg-amber-400"
      : "bg-green-500";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
      <p className="text-sm font-semibold leading-tight line-clamp-2">{region.region}</p>

      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">{rate.toFixed(0)}%</span>
        <span className="text-xs text-gray-400">{region.hospital_count} inst.</span>
      </div>

      {/* Mini progress bar */}
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(rate, 150) / 1.5}%` }}
        />
      </div>

      {region.hospitals_over_100 > 0 && (
        <p className="text-xs text-red-600">
          {region.hospitals_over_100} inst. &gt; 100%
        </p>
      )}
    </div>
  );
}
