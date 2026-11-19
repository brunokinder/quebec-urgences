import type { HourlyProfileCell } from "@quebec-urgences/shared";
import { PROFILE_MIN_SAMPLES, PROFILE_WEEKS } from "@quebec-urgences/shared";
import { WEEK_ROWS } from "@/lib/trends";

interface Props {
  /** Indexed by `${dow}-${hour}`, already filtered to cells with enough samples. */
  profile: Map<string, HourlyProfileCell>;
  /** Highlight the current weekday × hour. */
  now: { dow: number; hour: number };
}

/** Background class for a median rate — same colour scale as the rest of the app. */
function cellClass(rate: number): string {
  if (rate >= 130) return "bg-red-500/90";
  if (rate >= 100) return "bg-red-500/55";
  if (rate >= 80) return "bg-amber-400/60";
  if (rate >= 60) return "bg-emerald-500/55";
  return "bg-emerald-500/25";
}

const LEGEND = [
  { cls: "bg-emerald-500/25", label: "< 60%" },
  { cls: "bg-emerald-500/55", label: "60–80%" },
  { cls: "bg-amber-400/60", label: "80–100%" },
  { cls: "bg-red-500/55", label: "100–130%" },
  { cls: "bg-red-500/90", label: "> 130%" },
];

/**
 * Weekday × hour grid of the usual (median) occupation over the last weeks.
 * Server component: plain divs, no chart library.
 */
export function WeeklyHeatmap({ profile, now }: Props) {
  const hours = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="space-y-3">
      {/* The grid scrolls inside its card on narrow screens; the page itself never does. */}
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="border-separate border-spacing-[2px] text-[10px] text-slate-400 min-w-[560px] w-full">
          <caption className="sr-only">
            Taux d&apos;occupation médian par jour et par heure, {PROFILE_WEEKS} dernières semaines
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-8" />
              {hours.map((h) => (
                <th key={h} scope="col" className="font-normal tabular-nums">
                  {h % 3 === 0 ? `${h}h` : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEK_ROWS.map((row) => (
              <tr key={row.dow}>
                <th scope="row" className="font-normal text-left pr-1">
                  {row.short}
                </th>
                {hours.map((h) => {
                  const cell = profile.get(`${row.dow}-${h}`);
                  const isNow = row.dow === now.dow && h === now.hour;
                  const label = cell
                    ? `${row.long} ${h}h — médiane ${Math.round(cell.median_taux)}% (${cell.samples} relevés)`
                    : `${row.long} ${h}h — pas assez de données`;
                  return (
                    <td
                      key={h}
                      title={label}
                      aria-label={label}
                      className={`h-5 rounded-xs ${cell ? cellClass(cell.median_taux) : "bg-surface-subtle"} ${
                        isNow ? "ring-2 ring-blue-400" : ""
                      }`}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-xs ${l.cls}`} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs ring-2 ring-blue-400" />
          maintenant
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Médiane des relevés horaires des {PROFILE_WEEKS} dernières semaines (case grise : moins de{" "}
        {PROFILE_MIN_SAMPLES} relevés).
      </p>
    </div>
  );
}
