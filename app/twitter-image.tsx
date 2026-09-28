import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AEO Command — AEO platform for agencies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0f172a",
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 26, color: "#38bdf8", fontWeight: 600 }}>
          AEO Command
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#f8fafc",
            marginTop: 20,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          Rank in ChatGPT & AI answers — agency workflow
        </div>
        <div style={{ fontSize: 24, color: "#94a3b8", marginTop: 24 }}>
          Multi-client scan · Action Center · white-label reports
        </div>
      </div>
    ),
    { ...size }
  );
}
