import { ImageResponse } from "next/og";

export const alt = "Urgences Québec — taux d'occupation des urgences, mis à jour chaque heure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share preview (Facebook, LinkedIn, X, iMessage…). Static: no live numbers. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0d1117",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,12 6,12 7.5,6 10,18 13,9 15,13 16.5,12 22,12" />
            </svg>
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>Urgences Québec</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 48, lineHeight: 1.2, color: "#e2e8f0" }}>
            Le taux d&apos;occupation des urgences du Québec, mis à jour chaque heure.
          </div>
          <div style={{ display: "flex", gap: 28, fontSize: 28, color: "#94a3b8" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: "#10b981" }} />
              &lt; 80 %
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: "#fbbf24" }} />
              80–100 %
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: "#ef4444" }} />
              &gt; 100 %
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#94a3b8" }}>
          <span>Données ouvertes MSSS · CC-BY 4.0 · Code open source</span>
          <span style={{ color: "#fca5a5" }}>Urgence vitale : 911 · Info-Santé : 811</span>
        </div>
      </div>
    ),
    size,
  );
}
