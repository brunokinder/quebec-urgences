import type { UrgenceSnapshot } from "@quebec-urgences/shared";
import { CRITICAL_OCCUPATION_THRESHOLD, HIGH_OCCUPATION_THRESHOLD } from "@quebec-urgences/shared";
import Link from "next/link";

interface Props {
  snapshot: UrgenceSnapshot;
  distance?: number;
}

export function HospitalCard({ snapshot: s, distance }: Props) {
  const rate = s.taux_occupation;
  const isCritical = rate >= CRITICAL_OCCUPATION_THRESHOLD;
  const isHigh = rate >= HIGH_OCCUPATION_THRESHOLD;

  const barColor = isCritical ? "bg-red-500" : isHigh ? "bg-amber-400" : "bg-emerald-500";
  const rateColor = isCritical ? "text-red-400" : isHigh ? "text-amber-400" : "text-emerald-400";

  const statusLabel = isCritical ? "Critique" : isHigh ? "Chargé" : "Disponible";
  const statusClasses = isCritical
    ? "bg-red-500/10 text-red-400 border border-red-500/20"
    : isHigh
    ? "bg-amber-400/10 text-amber-400 border border-amber-500/20"
    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";

  const cardBorder = isCritical
    ? "border-red-500/20"
    : isHigh
    ? "border-amber-500/20"
    : "border-surface-border";

  return (
    <Link
      href={`/hopital/${encodeURIComponent(s.nom_installation)}`}
      className={`block bg-surface-card rounded-xl border ${cardBorder} p-4 space-y-3 hover:bg-surface-hover transition-all group`}
    >
      {/* Distance */}
      {distance != null && (
        <div className="flex justify-end">
          <span className="text-xs text-slate-500 tabular-nums">
            {distance < 1
              ? `${Math.round(distance * 1000)} m`
              : `${distance.toFixed(0)} km`}
          </span>
        </div>
      )}

      {/* Name + region */}
      <div>
        <p className="text-sm font-medium text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {s.nom_installation}
        </p>
        <p className="text-xs text-slate-600 mt-0.5 uppercase tracking-wide">{s.region}</p>
      </div>

      {/* Occupation rate + status badge */}
      <div className="flex items-end justify-between gap-2">
        <span className={`text-3xl font-bold tabular-nums ${rateColor}`}>
          {rate != null ? `${rate.toFixed(0)}%` : "—"}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusClasses}`}>
          {statusLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-surface-subtle overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(rate ?? 0, 150) / 1.5}%` }}
        />
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>
          {s.nb_patients_civieres ?? "—"} / {s.nb_civieres ?? "—"} civières
        </span>
        {s.nb_patients_civieres_24h != null && (
          <span>&gt;24h: {s.nb_patients_civieres_24h}</span>
        )}
      </div>
    </Link>
  );
}
