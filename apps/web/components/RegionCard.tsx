import type { RegionSummary } from "@quebec-urgences/shared";
import { occupationLevel } from "@quebec-urgences/shared";

interface Props {
  region: RegionSummary;
}

export function RegionCard({ region }: Props) {
  const rate = region.avg_taux_occupation;
  const level = occupationLevel(rate);
  const isCritical = level === "critical";
  const isHigh = level === "high";
  const isUnknown = level === "unknown";
  const missing = region.hospital_count - region.reporting_count;

  const barColor = isCritical ? "bg-red-500" : isHigh ? "bg-amber-400" : isUnknown ? "bg-slate-600" : "bg-emerald-500";
  const rateColor = isCritical ? "text-red-400" : isHigh ? "text-amber-400" : isUnknown ? "text-slate-500" : "text-emerald-400";
  const cardBorder = isCritical
    ? "border-red-500/20 shadow-red-500/5"
    : isHigh
    ? "border-amber-500/20"
    : "border-surface-border";

  return (
    <div className={`bg-surface-card rounded-xl border ${cardBorder} p-4 space-y-3 shadow-sm hover:border-slate-600 transition-colors`}>
      <p className="text-xs font-medium text-slate-400 leading-tight line-clamp-2 tracking-wide">
        {region.region}
      </p>

      <div className="flex items-end justify-between">
        <span className={`text-3xl font-bold tabular-nums ${rateColor}`}>
          {rate != null ? `${rate.toFixed(0)}%` : "—"}
        </span>
        <span className="text-xs text-slate-600 mb-1">{region.hospital_count} inst.</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-surface-subtle overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(rate ?? 0, 150) / 1.5}%` }}
        />
      </div>

      {missing > 0 && (
        <p className="text-xs text-slate-500">{missing} inst. sans données récentes</p>
      )}

      {region.hospitals_over_100 > 0 && (
        <p className="text-xs text-red-400 font-medium">
          ⚠ {region.hospitals_over_100} inst. &gt; 100%
        </p>
      )}
    </div>
  );
}
