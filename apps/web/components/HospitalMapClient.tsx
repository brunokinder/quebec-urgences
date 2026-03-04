"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useState, useCallback, useMemo } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { MapLibreEvent } from "maplibre-gl";
import type { UrgenceSnapshot } from "@quebec-urgences/shared";
import {
  CRITICAL_OCCUPATION_THRESHOLD,
  HIGH_OCCUPATION_THRESHOLD,
} from "@quebec-urgences/shared";
import { getHospitalCoords } from "@/lib/hospitalCoordinates";

/* ─── helpers ──────────────────────────────────────────────────────── */

function getMarkerColor(rate: number | null): string {
  if (rate == null) return "#64748b";
  if (rate >= CRITICAL_OCCUPATION_THRESHOLD) return "#f87171";
  if (rate >= HIGH_OCCUPATION_THRESHOLD) return "#fbbf24";
  return "#34d399";
}

const STRIP_PREFIXES =
  /^(hôpital|hopital|centre hospitalier universitaire|centre hospitalier|hôtel-dieu|hotel-dieu|ciusss|cisss)\s+(du|de la|de|des|d'|l'|d'|l')?/i;

function abbreviateName(name: string): string {
  let short = name.replace(STRIP_PREFIXES, "").trim();
  short = short.replace(/^(de |du |des |d'|l')/i, "").trim();
  if (short.length > 22) {
    const words = short.split(/\s+/);
    short = words.slice(0, 2).join(" ");
  }
  return short.length > 22 ? short.slice(0, 20) + "\u2026" : short;
}

function buildGeoJSON(snapshots: UrgenceSnapshot[]) {
  return {
    type: "FeatureCollection" as const,
    features: snapshots.map((s) => {
      const coords = getHospitalCoords(s.nom_installation, s.region);
      const rate = s.taux_occupation ?? 0;
      const color = getMarkerColor(s.taux_occupation);
      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [coords[1], coords[0]], // GeoJSON = [lng, lat]
        },
        properties: {
          id: s.id,
          name: s.nom_installation,
          region: s.region,
          rate,
          rateStr: `${Math.round(rate)}%`,
          shortName: abbreviateName(s.nom_installation),
          color,
          sortKey: -rate, // higher occupation → shown first on collision
          patients: s.nb_patients_civieres,
          stretchers: s.nb_civieres,
          patients24h: s.nb_patients_civieres_24h,
          patients48h: s.nb_patients_civieres_48h,
          slug: encodeURIComponent(s.nom_installation),
        },
      };
    }),
  };
}

/** Create pill background as a stretchable image for MapLibre. */
function addPillImage(map: maplibregl.Map) {
  if (map.hasImage("pill-bg")) return;
  const size = 40;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = 8;
  ctx.fillStyle = "rgba(13,17,23,0.90)";
  ctx.strokeStyle = "rgba(48,54,61,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r, 0.5);
  ctx.lineTo(size - r, 0.5);
  ctx.quadraticCurveTo(size - 0.5, 0.5, size - 0.5, r);
  ctx.lineTo(size - 0.5, size - r);
  ctx.quadraticCurveTo(size - 0.5, size - 0.5, size - r, size - 0.5);
  ctx.lineTo(r, size - 0.5);
  ctx.quadraticCurveTo(0.5, size - 0.5, 0.5, size - r);
  ctx.lineTo(0.5, r);
  ctx.quadraticCurveTo(0.5, 0.5, r, 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const imageData = ctx.getImageData(0, 0, size, size);
  map.addImage(
    "pill-bg",
    { width: size, height: size, data: new Uint8Array(imageData.data.buffer) },
    { content: [4, 4, 36, 36], stretchX: [[8, 32]], stretchY: [[8, 32]] },
  );
}

/* ─── Main component ──────────────────────────────────────────────── */

interface Props {
  snapshots: UrgenceSnapshot[];
}

export default function HospitalMapClient({ snapshots }: Props) {
  const [popupInfo, setPopupInfo] = useState<Record<string, unknown> | null>(null);
  const [ready, setReady] = useState(false);

  const geojson = useMemo(() => buildGeoJSON(snapshots), [snapshots]);

  const onMapLoad = useCallback((e: MapLibreEvent) => {
    addPillImage(e.target);
    setReady(true);
  }, []);

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      setPopupInfo(null);
      return;
    }
    const coords = (feature.geometry as GeoJSON.Point).coordinates;
    setPopupInfo({ longitude: coords[0], latitude: coords[1], ...feature.properties });
  }, []);

  const rate = Number(popupInfo?.rate ?? 0);

  return (
    <Map
      initialViewState={{ longitude: -72.0, latitude: 47.5, zoom: 6 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      onLoad={onMapLoad}
      onClick={onClick}
      onMouseEnter={() => {
        const el = document.querySelector<HTMLCanvasElement>(".maplibregl-canvas");
        if (el) el.style.cursor = "pointer";
      }}
      onMouseLeave={() => {
        const el = document.querySelector<HTMLCanvasElement>(".maplibregl-canvas");
        if (el) el.style.cursor = "";
      }}
      interactiveLayerIds={["hospital-circles", "hospital-labels"]}
    >
      <NavigationControl position="top-left" />
      <GeolocateControl position="top-left" trackUserLocation />

      <Source id="hospitals" type="geojson" data={geojson}>
        {/* Colored glow behind each dot */}
        <Layer
          id="hospital-glow"
          type="circle"
          paint={{
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 8, 10, 12, 14, 16],
            "circle-color": ["get", "color"],
            "circle-opacity": 0.15,
            "circle-blur": 1,
          }}
        />

        {/* Colored dot at each hospital */}
        <Layer
          id="hospital-circles"
          type="circle"
          paint={{
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 10, 6, 14, 8],
            "circle-color": ["get", "color"],
            "circle-opacity": 0.85,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": ["get", "color"],
            "circle-stroke-opacity": 0.3,
          }}
        />

        {/* Pill-badge labels with collision detection */}
        {ready && (
          <Layer
            id="hospital-labels"
            type="symbol"
            layout={{
              "text-field": ["concat", ["get", "shortName"], "  ", ["get", "rateStr"]],
              "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
              "text-size": 11,
              "text-offset": [1, 0],
              "text-anchor": "left",
              "text-allow-overlap": false,
              "icon-allow-overlap": false,
              "icon-image": "pill-bg",
              "icon-text-fit": "both" as unknown as undefined,
              "icon-text-fit-padding": [3, 7, 3, 7] as unknown as undefined,
              "symbol-sort-key": ["get", "sortKey"],
            }}
            paint={{
              "text-color": ["get", "color"],
              "icon-opacity": 0.92,
            }}
          />
        )}
      </Source>

      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude as number}
          latitude={popupInfo.latitude as number}
          anchor="bottom"
          closeOnClick={false}
          onClose={() => setPopupInfo(null)}
          maxWidth="260px"
        >
          <div style={{ minWidth: 180, padding: 4 }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#111827" }}>
              {String(popupInfo.name)}
            </p>
            <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>
              {String(popupInfo.region)}
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
                {Math.round(rate)}%
              </span>
              <span style={{ fontSize: 12, color: "#374151" }}>occupation</span>
            </div>
            {popupInfo.patients != null && (
              <p style={{ fontSize: 12, color: "#374151", marginBottom: 2 }}>
                Patients: {String(popupInfo.patients)} / {String(popupInfo.stretchers ?? "?")} civ.
              </p>
            )}
            {(popupInfo.patients24h != null || popupInfo.patients48h != null) && (
              <p style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
                &gt;24h / &gt;48h: {String(popupInfo.patients24h ?? "\u2014")} /{" "}
                {String(popupInfo.patients48h ?? "\u2014")}
              </p>
            )}
            <a
              href={`/hopital/${String(popupInfo.slug)}`}
              style={{ fontSize: 12, color: "#2563eb", textDecoration: "underline" }}
            >
              Voir détails →
            </a>
          </div>
        </Popup>
      )}
    </Map>
  );
}
