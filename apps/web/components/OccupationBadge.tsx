import { CRITICAL_OCCUPATION_THRESHOLD, HIGH_OCCUPATION_THRESHOLD } from "@urgences-quebec/shared";

interface Props {
  rate: number | null;
  size?: "sm" | "md" | "lg";
}

export function OccupationBadge({ rate, size = "md" }: Props) {
  if (rate == null) return <span className="text-gray-400">—</span>;

  const color =
    rate >= CRITICAL_OCCUPATION_THRESHOLD
      ? "bg-red-100 text-red-700"
      : rate >= HIGH_OCCUPATION_THRESHOLD
      ? "bg-amber-100 text-amber-700"
      : "bg-green-100 text-green-700";

  const textSize =
    size === "lg" ? "text-xl font-bold px-3 py-1" :
    size === "sm" ? "text-xs px-2 py-0.5" :
    "text-sm font-semibold px-2 py-0.5";

  return (
    <span className={`inline-block rounded-full ${color} ${textSize}`}>
      {rate.toFixed(0)}%
    </span>
  );
}
