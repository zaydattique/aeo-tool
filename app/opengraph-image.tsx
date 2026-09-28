import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AEO Command — Answer Engine Optimization for agencies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#94a3b8",
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          AEO Command · by Threezero Agency
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#f8fafc",
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            Answer Engine Optimization for agencies
          </div>
          <div style={{ fontSize: 28, color: "#cbd5e1", maxWidth: 900 }}>
            Scan → Action Center → AI visibility → white-label reports
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#64748b" }}>
          Multi-tenant · Pakistan & International plans · 14-day trial
        </div>
      </div>
    ),
    { ...size }
  );
}
