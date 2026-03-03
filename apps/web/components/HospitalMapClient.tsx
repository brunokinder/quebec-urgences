"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { UrgenceSnapshot } from "@quebec-urgences/shared";
import {
  CRITICAL_OCCUPATION_THRESHOLD,
  HIGH_OCCUPATION_THRESHOLD,
} from "@quebec-urgences/shared";
import { getHospitalCoords } from "@/lib/hospitalCoordinates";
import Link from "next/link";

const QUEBEC_CITY: [number, number] = [46.8139, -71.208];

function GeolocationController() {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      map.flyTo(QUEBEC_CITY, 10, { duration: 1.2 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 11, { duration: 1.5 });
      },
      () => {
        map.flyTo(QUEBEC_CITY, 10, { duration: 1.2 });
      },
      { timeout: 8000 }
    );
  }, [map]);

  return null;
}

interface Props {
  snapshots: UrgenceSnapshot[];
}

function getMarkerColor(rate: number | null): string {
  if (rate == null) return "#64748b";
  if (rate >= CRITICAL_OCCUPATION_THRESHOLD) return "#f87171";
  if (rate >= HIGH_OCCUPATION_THRESHOLD) return "#fbbf24";
  return "#34d399";
}

export default function HospitalMapClient({ snapshots }: Props) {
  return (
    <MapContainer
      center={[47.5, -72.0]}
      zoom={6}
      style={{ height: "100%", width: "100%", background: "#0d1117" }}
      zoomControl={true}
    >
      <GeolocationController />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      {snapshots.map((s) => {
        const coords = getHospitalCoords(s.nom_installation, s.region);
        const rate = s.taux_occupation ?? 0;
        const color = getMarkerColor(s.taux_occupation);

        return (
          <CircleMarker
            key={s.id}
            center={coords}
            radius={rate >= CRITICAL_OCCUPATION_THRESHOLD ? 8 : rate >= HIGH_OCCUPATION_THRESHOLD ? 7 : 6}
            pathOptions={{
              fillColor: color,
              color: color,
              weight: 1.5,
              opacity: 0.9,
              fillOpacity: 0.65,
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                  {s.nom_installation}
                </p>
                <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>
                  {s.region}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 700,
                      background:
                        rate >= CRITICAL_OCCUPATION_THRESHOLD
                          ? "#fee2e2"
                          : rate >= HIGH_OCCUPATION_THRESHOLD
                          ? "#fef3c7"
                          : "#d1fae5",
                      color:
                        rate >= CRITICAL_OCCUPATION_THRESHOLD
                          ? "#b91c1c"
                          : rate >= HIGH_OCCUPATION_THRESHOLD
                          ? "#92400e"
                          : "#065f46",
                    }}
                  >
                    {rate.toFixed(0)}%
                  </span>
                  <span style={{ fontSize: 12, color: "#374151" }}>occupation</span>
                </div>
                {s.nb_patients_civieres != null && (
                  <p style={{ fontSize: 12, color: "#374151", marginBottom: 2 }}>
                    Patients: {s.nb_patients_civieres} / {s.nb_civieres ?? "?"} civ.
                  </p>
                )}
                {(s.nb_patients_civieres_24h != null || s.nb_patients_civieres_48h != null) && (
                  <p style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
                    &gt;24h / &gt;48h: {s.nb_patients_civieres_24h ?? "—"} / {s.nb_patients_civieres_48h ?? "—"}
                  </p>
                )}
                <a
                  href={`/hopital/${encodeURIComponent(s.nom_installation)}`}
                  style={{ fontSize: 12, color: "#2563eb", textDecoration: "underline" }}
                >
                  Voir détails →
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
