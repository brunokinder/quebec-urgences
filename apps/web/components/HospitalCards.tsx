"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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

  const local = getCoordsByFsa(fsa);
  if (local) return local;

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

  // Auto-detect if permission was already granted (fixes: browser prompts on load but app doesn't react)
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (result.state === "granted") detect();
        result.onchange = () => {
          if (result.state === "granted") detect();
        };
      })
      .catch(() => {});
  }, [detect]);

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

  // All hospitals sorted: by distance when location known, by lowest occupancy otherwise
  const allSorted = useMemo((): SortedItem[] => {
    if (location.status !== "detected") {
      return [...snapshots]
        .sort((a, b) => (a.taux_occupation ?? 0) - (b.taux_occupation ?? 0))
        .map((s) => ({ snapshot: s }));
    }
    const userCoords = location.coords;
    return [...snapshots]
      .map((s) => ({
        snapshot: s,
        distance: distanceKm(userCoords, getHospitalCoords(s.nom_installation, s.region)),
      }))
      .sort((a, b) => a.distance! - b.distance!);
  }, [snapshots, location]);

  const filtered = useMemo((): SortedItem[] => {
    if (!search) return allSorted;
    const q = search.toLowerCase();
    return allSorted.filter(
      (item) =>
        item.snapshot.nom_installation.toLowerCase().includes(q) ||
        item.snapshot.region.toLowerCase().includes(q)
    );
  }, [allSorted, search]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hiddenCount = filtered.length - INITIAL_COUNT;
  const locationKnown = location.status === "detected";

  return (
    <div className="space-y-6">
      {/* Location prompt — shown until position is known */}
      {!locationKnown && (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-5 space-y-3">
          <div>
            <p className="text-base font-semibold text-slate-200">
              Trouvez l&apos;urgence la moins achalandée près de chez vous
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Activez la localisation ou entrez votre code postal pour trier par proximité
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={detect}
              disabled={location.status === "loading"}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 transition-colors font-medium"
            >
              <span>📍</span>
              {location.status === "loading" ? "Détection…" : "Détecter ma position"}
            </button>

            <span className="text-xs text-slate-600">ou</span>

            <form onSubmit={handlePostalSubmit} className="flex gap-1.5">
              <datalist id="fsa-list">
                {Object.entries(FSA_COORDS).map(([fsa, { label }]) => (
                  <option key={fsa} value={fsa}>{label}</option>
                ))}
              </datalist>
              <input
                type="text"
                value={postalInput}
                onChange={(e) => setPostalInput(e.target.value)}
                placeholder="Code postal (ex: H3A)"
                maxLength={7}
                list="fsa-list"
                className="border border-surface-border rounded-lg px-3 py-2 text-sm w-44 bg-surface-subtle text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={postalLoading || !postalInput}
                className="text-sm px-3 py-2 rounded-lg bg-surface-subtle border border-surface-border text-slate-300 hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                {postalLoading ? "…" : "OK"}
              </button>
            </form>

            {location.status === "error" && (
              <p className="text-xs text-red-400">{location.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Location active — status bar */}
      {locationKnown && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-card px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="shrink-0">📍</span>
            <span className="text-emerald-400 font-medium truncate">
              {(location as Extract<LocationState, { status: "detected" }>).label}
            </span>
            <span className="text-slate-600 shrink-0">· trié par proximité</span>
          </div>
          <button
            onClick={() => { setLocation({ status: "idle" }); setPostalInput(""); }}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-surface-border bg-surface-subtle text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3.414a2 2 0 01.586-1.414z" />
            </svg>
            Modifier
          </button>
        </div>
      )}

      {/* Hospital grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            {locationKnown ? "Meilleures options près de vous" : "Toutes les urgences · par disponibilité"}
          </p>
          <input
            type="search"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-surface-border rounded-lg px-3 py-1.5 text-sm w-40 bg-surface-card text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {visible.map((item) => (
            <HospitalCard
              key={item.snapshot.id}
              snapshot={item.snapshot}
              distance={item.distance}
            />
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-slate-500 col-span-full py-6 text-center">
              Aucun résultat pour «&nbsp;{search}&nbsp;»
            </p>
          )}
        </div>

        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-sm py-2.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-slate-400 transition-colors"
          >
            Voir les {hiddenCount} autres installations →
          </button>
        )}
        {showAll && filtered.length > INITIAL_COUNT && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full text-sm py-2.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-slate-400 transition-colors"
          >
            ↑ Réduire
          </button>
        )}
      </section>
    </div>
  );
}
