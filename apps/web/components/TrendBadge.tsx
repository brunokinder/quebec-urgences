import type { HospitalTrend } from "@quebec-urgences/shared";
import { TREND_WINDOW_HOURS } from "@quebec-urgences/shared";
import { summarizeTrend } from "@/lib/trends";

interface Props {
  trend: HospitalTrend | undefined;
  /** "compact" for cards, "full" adds a sentence for the hospital page. */
  variant?: "compact" | "full";
}

/**
 * Shows whether occupation is rising or falling vs TREND_WINDOW_HOURS ago.
 * Rising is shown in red (getting worse), falling in green.
 */
export function TrendBadge({ trend, variant = "compact" }: Props) {
  const t = summarizeTrend(trend);
  if (!t) return null;

  const arrow = t.direction === "up" ? "↗" : t.direction === "down" ? "↘" : "→";
  const color =
    t.direction === "up" ? "text-red-400" : t.direction === "down" ? "text-emerald-400" : "text-slate-400";
  const pts = `${t.delta > 0 ? "+" : ""}${t.delta} pts`;
  const label =
    t.direction === "up" ? "En hausse" : t.direction === "down" ? "En baisse" : "Stable";
  const srText = `${label} : ${pts} en ${TREND_WINDOW_HOURS} heures`;

  if (variant === "full") {
    return (
      <p className={`text-sm ${color}`}>
        <span aria-hidden="true">{arrow} </span>
        {label} — {pts} depuis {TREND_WINDOW_HOURS} h
      </p>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs tabular-nums ${color}`}
      title={srText}
    >
      <span aria-hidden="true">{arrow}</span>
      <span aria-hidden="true">{t.direction === "stable" ? "stable" : `${pts} / ${TREND_WINDOW_HOURS} h`}</span>
      <span className="sr-only">{srText}</span>
    </span>
  );
}
