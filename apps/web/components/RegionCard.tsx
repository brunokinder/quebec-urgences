import type { RegionSummary } from "@quebec-urgences/shared";
import { CRITICAL_OCCUPATION_THRESHOLD, HIGH_OCCUPATION_THRESHOLD } from "@quebec-urgences/shared";

interface Props {
  region: RegionSummary;
}

export function RegionCard({ region }: Props) {
  const rate = region.avg_taux_occupation;
  const isCritical = rate >= CRITICAL_OCCUPATION_THRESHOLD;
  const isHigh = rate >= HIGH_OCCUPATION_THRESHOLD;

  const barColor = isCritical ? "bg-red-500" : isHigh ? "bg-amber-400" : "bg-emerald-500";
  const rateColor = isCritical ? "text-red-400" : isHigh ? "text-amber-400" : "text-emerald-400";
  const cardBorder = isCritical
    ? "border-red-500/20 shadow-red-500/5"
    : isHigh
    ? "border-amber-500/20"
    : "border-surface-border";

  return (
    <div className={`bg-surface-card rounded-xl border ${cardBorder} p-4 space-y-3 shadow-sm hover:border-slate-600 transition-colors`}>
      <p className="text-xs font-medium text-slate-400 leading-tight line-clamp-2 uppercase tracking-wide">
        {region.region}
      </p>

      <div className="flex items-end justify-between">
        <span className={`text-3xl font-bold tabular-nums ${rateColor}`}>
          {rate.toFixed(0)}%
        </span>
        <span className="text-xs text-slate-600 mb-1">{region.hospital_count} inst.</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-surface-subtle overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(rate, 150) / 1.5}%` }}
        />
      </div>

      {region.hospitals_over_100 > 0 && (
        <p className="text-xs text-red-400 font-medium">
          ⚠ {region.hospitals_over_100} inst. &gt; 100%
        </p>
      )}
    </div>
  );
}
