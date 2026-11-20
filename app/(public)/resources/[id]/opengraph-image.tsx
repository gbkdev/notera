import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";
import { UUID_RE } from "@/lib/utils";
import { FORMAT_STYLE, formatGroupOf } from "@/lib/formats";

export const alt = "Resource on Notera";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";


export default async function Image(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { data: r } = UUID_RE.test(params.id)
    ? await createPublicClient().from("resource_details")
        .select("title, course_code, course_name, department_name, category_label, file_ext").eq("id", params.id).maybeSingle()
    : { data: null };

  const color = FORMAT_STYLE[formatGroupOf(r?.file_ext ?? "pdf")].hex;
  const title = (r?.title ?? "Notera").slice(0, 110);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0E1433", color: "#F2F4FA" }}>
        <div style={{ width: 36, background: color, display: "flex" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
            <div style={{ display: "flex", width: 48, height: 48, borderRadius: 10, background: "#4A63F0" }} />
            Notera
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {r && (
              <div style={{ display: "flex", gap: 14, fontSize: 28 }}>
                <span style={{ background: color, padding: "6px 16px", borderRadius: 8, fontWeight: 700 }}>{r.file_ext.toUpperCase()}</span>
                <span style={{ padding: "6px 0", color: "#B7BED8" }}>{r.category_label}</span>
              </div>
            )}
            <div style={{ fontSize: title.length > 60 ? 56 : 72, fontWeight: 800, lineHeight: 1.08 }}>{title}</div>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#B7BED8" }}>
            {r ? `${r.course_code} ${r.course_name} · ${r.department_name}` : "Your Learning Resources, All in One Place."}
          </div>
        </div>
      </div>
    ),
    size
  );
}
