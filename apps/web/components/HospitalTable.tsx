"use client";

import { useState, useMemo } from "react";
import type { UrgenceSnapshot } from "@quebec-urgences/shared";
import { OccupationBadge } from "./OccupationBadge";
import Link from "next/link";

interface Props {
  snapshots: UrgenceSnapshot[];
}

type SortKey = "taux_occupation" | "nom_installation" | "region" | "nb_patients_civieres";

export function HospitalTable({ snapshots }: Props) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("taux_occupation");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const regions = useMemo(
    () => ["all", ...Array.from(new Set(snapshots.map((s) => s.region))).sort()],
    [snapshots]
  );

  const filtered = useMemo(() => {
    let rows = snapshots;
    if (region !== "all") rows = rows.filter((s) => s.region === region);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((s) => s.nom_installation.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => {
      const aVal = a[sortKey] ?? -Infinity;
      const bVal = b[sortKey] ?? -Infinity;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [snapshots, search, region, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-slate-700 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thClass =
    "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none whitespace-nowrap transition-colors";

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Rechercher un établissement…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 flex-1 min-w-48 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
        >
          {regions.map((r) => (
            <option key={r} value={r} className="bg-surface-card">
              {r === "all" ? "Toutes les régions" : r}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-600">{filtered.length} résultats</p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm bg-surface-card">
          <thead className="bg-surface-subtle border-b border-surface-border">
            <tr>
              <th className={thClass} onClick={() => toggleSort("nom_installation")}>
                Installation <SortIcon col="nom_installation" />
              </th>
              <th className={`${thClass} hidden md:table-cell`} onClick={() => toggleSort("region")}>
                Région <SortIcon col="region" />
              </th>
              <th className={thClass} onClick={() => toggleSort("taux_occupation")}>
                Occupation <SortIcon col="taux_occupation" />
              </th>
              <th className={`${thClass} hidden sm:table-cell`} onClick={() => toggleSort("nb_patients_civieres")}>
                Pts / Civ. <SortIcon col="nb_patients_civieres" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">
                &gt;24h / &gt;48h
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-surface-hover transition-colors group">
                <td className="px-4 py-2.5 font-medium">
                  <Link
                    href={`/hopital/${encodeURIComponent(s.nom_installation)}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors text-xs sm:text-sm leading-tight"
                  >
                    {s.nom_installation}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs hidden md:table-cell">
                  {s.region}
                </td>
                <td className="px-4 py-2.5">
                  <OccupationBadge rate={s.taux_occupation} size="sm" />
                </td>
                <td className="px-4 py-2.5 text-slate-400 tabular-nums text-xs hidden sm:table-cell">
                  {s.nb_patients_civieres ?? "—"} / {s.nb_civieres ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-500 tabular-nums text-xs hidden lg:table-cell">
                  {s.nb_patients_civieres_24h ?? "—"} / {s.nb_patients_civieres_48h ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
