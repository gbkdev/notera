import { ImageResponse } from "next/og";

export const alt = "Notera: your learning resources, all in one place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", background: "#0E1433", color: "#F2F4FA" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 54, height: 54, borderRadius: 12, background: "#4A63F0" }} />
          Notera
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>Your Learning Resources, All in One Place.</div>
        <div style={{ display: "flex", fontSize: 30, color: "#B7BED8" }}>Notes, assignments, exams and slides. No account needed.</div>
      </div>
    ),
    size
  );
}
