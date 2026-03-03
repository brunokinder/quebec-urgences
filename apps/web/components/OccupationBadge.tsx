import { CRITICAL_OCCUPATION_THRESHOLD, HIGH_OCCUPATION_THRESHOLD } from "@quebec-urgences/shared";

interface Props {
  rate: number | null;
  size?: "sm" | "md" | "lg";
}

export function OccupationBadge({ rate, size = "md" }: Props) {
  if (rate == null) return <span className="text-slate-600">—</span>;

  const color =
    rate >= CRITICAL_OCCUPATION_THRESHOLD
      ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
      : rate >= HIGH_OCCUPATION_THRESHOLD
      ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
      : "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30";

  const textSize =
    size === "lg" ? "text-xl font-bold px-3 py-1" :
    size === "sm" ? "text-xs px-2 py-0.5 font-semibold" :
    "text-sm font-semibold px-2 py-0.5";

  return (
    <span className={`inline-block rounded-full ${color} ${textSize} tabular-nums`}>
      {rate.toFixed(0)}%
    </span>
  );
}
