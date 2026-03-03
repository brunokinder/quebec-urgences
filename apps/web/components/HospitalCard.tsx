import type { UrgenceSnapshot } from "@quebec-urgences/shared";
import { CRITICAL_OCCUPATION_THRESHOLD, HIGH_OCCUPATION_THRESHOLD } from "@quebec-urgences/shared";
import Link from "next/link";

interface Props {
  snapshot: UrgenceSnapshot;
  distance?: number; // km, shown only when location is known
}

export function HospitalCard({ snapshot: s, distance }: Props) {
  const rate = s.taux_occupation;
  const isCritical = rate >= CRITICAL_OCCUPATION_THRESHOLD;
  const isHigh = rate >= HIGH_OCCUPATION_THRESHOLD;

  const barColor = isCritical ? "bg-red-500" : isHigh ? "bg-amber-400" : "bg-emerald-500";
  const rateColor = isCritical ? "text-red-400" : isHigh ? "text-amber-400" : "text-emerald-400";
  const cardBorder = isCritical
    ? "border-red-500/20"
    : isHigh
    ? "border-amber-500/20"
    : "border-surface-border";

  return (
    <Link
      href={`/hopital/${encodeURIComponent(s.nom_installation)}`}
      className={`block bg-surface-card rounded-xl border ${cardBorder} p-4 space-y-3 shadow-sm hover:border-slate-600 hover:bg-surface-hover transition-all`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-300 leading-tight line-clamp-2 flex-1">
          {s.nom_installation}
        </p>
        {distance != null && (
          <span className="text-xs text-slate-600 shrink-0 mt-0.5 tabular-nums">
            {distance < 1
              ? `${Math.round(distance * 1000)} m`
              : `${distance.toFixed(0)} km`}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-600 uppercase tracking-wide">{s.region}</p>

      <div className="flex items-end justify-between">
        <span className={`text-3xl font-bold tabular-nums ${rateColor}`}>
          {rate != null ? `${rate.toFixed(0)}%` : "—"}
        </span>
        <span className="text-xs text-slate-600 mb-1">
          {s.nb_patients_civieres ?? "—"} / {s.nb_civieres ?? "—"} civ.
        </span>
      </div>

      <div className="h-1 rounded-full bg-surface-subtle overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(rate ?? 0, 150) / 1.5}%` }}
        />
      </div>

      {(s.nb_patients_civieres_24h != null || s.nb_patients_civieres_48h != null) && (
        <p className="text-xs text-slate-600">
          &gt;24h: {s.nb_patients_civieres_24h ?? "—"} · &gt;48h:{" "}
          {s.nb_patients_civieres_48h ?? "—"}
        </p>
      )}
    </Link>
  );
}
