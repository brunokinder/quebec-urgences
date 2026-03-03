"use client";

import { useState, useMemo, useCallback } from "react";
import type { UrgenceSnapshot } from "@quebec-urgences/shared";
import { HospitalCard } from "./HospitalCard";
import { getHospitalCoords, distanceKm } from "@/lib/hospitalCoordinates";
import { FSA_COORDS, getCoordsByFsa } from "@/lib/fsaCoordinates";

interface Props {
  snapshots: UrgenceSnapshot[];
}

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "detected"; coords: [number, number]; label: string }
  | { status: "error"; message: string };

type SortedItem = { snapshot: UrgenceSnapshot; distance?: number };

const INITIAL_COUNT = 8;

async function geocodePostalCode(raw: string): Promise<[number, number] | null> {
  const fsa = raw.trim().slice(0, 3).toUpperCase();
  if (!/^[GHJghj][0-9][A-Za-z]$/.test(fsa)) return null;

  // Local lookup first — instant, no network call
  const local = getCoordsByFsa(fsa);
  if (local) return local;

  // Fall back to Nominatim for FSAs not in our table
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(fsa)}&countrycodes=ca&format=json&limit=1`,
      { headers: { "Accept-Language": "fr" } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {
    return null;
  }
}

export function HospitalCards({ snapshots }: Props) {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [showAll, setShowAll] = useState(false);
  const [postalInput, setPostalInput] = useState("");
  const [postalLoading, setPostalLoading] = useState(false);
  const [search, setSearch] = useState("");

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ status: "error", message: "Géolocalisation non supportée" });
      return;
    }
    setLocation({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          status: "detected",
          coords: [pos.coords.latitude, pos.coords.longitude],
          label: "Position détectée",
        });
        setShowAll(false);
      },
      () => {
        setLocation({
          status: "error",
          message: "Position refusée — entrez votre code postal",
        });
      }
    );
  }, []);

  async function handlePostalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!postalInput) return;
    setPostalLoading(true);
    const coords = await geocodePostalCode(postalInput);
    setPostalLoading(false);
    if (coords) {
      setLocation({
        status: "detected",
        coords,
        label: postalInput.trim().slice(0, 3).toUpperCase(),
      });
      setShowAll(false);
    } else {
      setLocation({ status: "error", message: "Code postal introuvable (ex: H3A)" });
    }
  }

  const sorted = useMemo((): SortedItem[] => {
    let rows = snapshots;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.nom_installation.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q)
      );
    }

    if (location.status !== "detected") {
      return [...rows]
        .sort((a, b) => (b.taux_occupation ?? 0) - (a.taux_occupation ?? 0))
        .map((s) => ({ snapshot: s }));
    }

    const userCoords = location.coords;
    return [...rows]
      .map((s) => ({
        snapshot: s,
        distance: distanceKm(userCoords, getHospitalCoords(s.nom_installation, s.region)),
      }))
      .sort((a, b) => a.distance! - b.distance!);
  }, [snapshots, location, search]);

  const visible = showAll ? sorted : sorted.slice(0, INITIAL_COUNT);
  const hiddenCount = sorted.length - INITIAL_COUNT;

  return (
    <div className="space-y-4">
      {/* Location + search bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={detect}
          disabled={location.status === "loading"}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-surface-border bg-surface-card text-slate-300 hover:bg-surface-hover disabled:opacity-50 transition-colors"
        >
          <span>📍</span>
          {location.status === "loading" ? "Détection…" : "Détecter ma position"}
        </button>

        <span className="text-xs text-slate-600">ou</span>

        <datalist id="fsa-list">
          {Object.entries(FSA_COORDS).map(([fsa, { label }]) => (
            <option key={fsa} value={fsa}>{label}</option>
          ))}
        </datalist>

        <form onSubmit={handlePostalSubmit} className="flex gap-1.5">
          <input
            type="text"
            value={postalInput}
            onChange={(e) => setPostalInput(e.target.value)}
            placeholder="Code postal (ex: H3A)"
            maxLength={7}
            list="fsa-list"
            className="border border-surface-border rounded-lg px-3 py-1.5 text-sm w-44 bg-surface-card text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            type="submit"
            disabled={postalLoading || !postalInput}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {postalLoading ? "…" : "OK"}
          </button>
        </form>

        <input
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-surface-border rounded-lg px-3 py-1.5 text-sm w-40 bg-surface-card text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />

        {location.status === "detected" && (
          <span className="text-xs text-emerald-400">✓ {location.label}</span>
        )}
        {location.status === "error" && (
          <span className="text-xs text-red-400">{location.message}</span>
        )}
        {location.status === "idle" && !search && (
          <span className="text-xs text-slate-600">
            trié par taux d'occupation · activez la position pour trier par proximité
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {visible.map((item) => (
          <HospitalCard
            key={item.snapshot.id}
            snapshot={item.snapshot}
            distance={item.distance}
          />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-slate-500 col-span-full py-4">
            Aucun résultat pour «&nbsp;{search}&nbsp;»
          </p>
        )}
      </div>

      {/* Show more / collapse */}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-sm py-2.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-slate-400 transition-colors"
        >
          Voir les {hiddenCount} autres installations →
        </button>
      )}
      {showAll && sorted.length > INITIAL_COUNT && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full text-sm py-2.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-slate-400 transition-colors"
        >
          ↑ Réduire
        </button>
      )}
    </div>
  );
}
