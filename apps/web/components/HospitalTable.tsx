"use client";

import { useState, useMemo } from "react";
import type { UrgenceSnapshot } from "@urgences-quebec/shared";
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

  const thClass = "px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none";

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Rechercher un établissement…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {regions.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "Toutes les régions" : r}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} résultats</p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className={thClass} onClick={() => toggleSort("nom_installation")}>
                Installation {sortKey === "nom_installation" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className={thClass} onClick={() => toggleSort("region")}>
                Région {sortKey === "region" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className={thClass} onClick={() => toggleSort("taux_occupation")}>
                Occupation {sortKey === "taux_occupation" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className={thClass} onClick={() => toggleSort("nb_patients_civieres")}>
                Patients / Civ. {sortKey === "nb_patients_civieres" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                &gt;24h / &gt;48h
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-medium">
                  <Link
                    href={`/hopital/${encodeURIComponent(s.nom_installation)}`}
                    className="hover:underline text-blue-700"
                  >
                    {s.nom_installation}
                  </Link>
                </td>
                <td className="px-3 py-2 text-gray-500">{s.region}</td>
                <td className="px-3 py-2">
                  <OccupationBadge rate={s.taux_occupation} size="sm" />
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {s.nb_patients_civieres ?? "—"} / {s.nb_civieres ?? "—"}
                </td>
                <td className="px-3 py-2 text-gray-500">
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
