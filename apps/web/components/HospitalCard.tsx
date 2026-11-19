import type { HospitalTrend, UrgenceSnapshot } from "@quebec-urgences/shared";
import { occupationLevel } from "@quebec-urgences/shared";
import Link from "next/link";
import { formatHospitalName } from "../lib/formatHospitalName";
import { TrendBadge } from "./TrendBadge";

/** Format decimal hours (e.g. 4.03) as "4h 02m" or "4h" if 0 minutes. */
function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

interface Props {
  snapshot: UrgenceSnapshot;
  distance?: number;
  trend?: HospitalTrend;
}

export function HospitalCard({ snapshot: s, distance, trend }: Props) {
  const rate = s.taux_occupation;
  // A hospital that stopped reporting is shown as unknown, whatever its last rate was.
  const level = s.is_stale ? "unknown" : occupationLevel(rate);
  const isCritical = level === "critical";
  const isHigh = level === "high";
  const isUnknown = level === "unknown";

  const barColor = isCritical ? "bg-red-500" : isHigh ? "bg-amber-400" : isUnknown ? "bg-slate-600" : "bg-emerald-500";
  const rateColor = isCritical ? "text-red-400" : isHigh ? "text-amber-400" : isUnknown ? "text-slate-400" : "text-emerald-400";

  const statusLabel = s.is_stale
    ? "Données périmées"
    : isUnknown
    ? "Données indisponibles"
    : isCritical
    ? "Critique"
    : isHigh
    ? "Chargé"
    : "Disponible";
  const statusClasses = isCritical
    ? "bg-red-500/10 text-red-400 border border-red-500/20"
    : isHigh
    ? "bg-amber-400/10 text-amber-400 border border-amber-500/20"
    : isUnknown
    ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";

  const updatedAt = new Date(s.timestamp).toLocaleString("fr-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
          <span className="text-xs text-slate-400 tabular-nums">
            {distance < 1
              ? `${Math.round(distance * 1000)} m`
              : `${distance.toFixed(0)} km`}
          </span>
        </div>
      )}

      {/* Name + region */}
      <div>
        <p className="text-sm font-medium text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {formatHospitalName(s.nom_installation)}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 tracking-wide">{s.region}</p>
      </div>

      {/* Occupation rate + status */}
      <div className="flex items-end justify-between gap-2">
        <span className={`text-3xl font-bold tabular-nums ${rateColor}`}>
          {rate != null ? `${rate.toFixed(0)}%` : "—"}
        </span>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusClasses}`}>
            {statusLabel}
          </span>
          {!isUnknown && <TrendBadge trend={trend} />}
        </div>
      </div>

      {s.is_stale && (
        <p className="text-xs text-slate-400">Dernier relevé : {updatedAt}</p>
      )}

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-surface-subtle overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${isUnknown ? 0 : Math.min(rate ?? 0, 150) / 1.5}%` }}
        />
      </div>

      {/* Footer stats */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {s.nb_patients_civieres ?? "—"} / {s.nb_civieres ?? "—"} civières
          </span>
          {s.nb_patients_civieres_24h != null && (
            <span>&gt;24h: {s.nb_patients_civieres_24h}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>En attente de prise en charge</span>
          <span className="tabular-nums text-slate-300">
            {s.nb_pec ?? "—"} patient{s.nb_pec === 1 ? "" : "s"}
          </span>
        </div>
        {s.dms_ambulatoire != null && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Séjour moyen (ambulatoire)</span>
            <span className="tabular-nums text-slate-300">{formatDuration(s.dms_ambulatoire)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
