import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const clean = (t: string) => t.replace(/[%*,()\\"'`:;]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);

export async function GET(req: Request) {
  const q = clean(new URL(req.url).searchParams.get("q") ?? "");
  if (q.length < 2) return NextResponse.json([]);
  const supabase = createClient();
  const [courses, resources] = await Promise.all([
    supabase.from("course_details").select("id, code, name, department_name")
      .or(`code.ilike.%${q}%,name.ilike.%${q}%`).limit(3),
    supabase.from("resource_details").select("id, title, course_code")
      .or(`title.ilike.%${q}%,file_name.ilike.%${q}%`).order("created_at", { ascending: false }).limit(4),
  ]);
  return NextResponse.json([
    ...(courses.data ?? []).map((c) => ({ type: "course", label: `${c.code} ${c.name}`, sub: c.department_name, href: `/courses/${c.id}` })),
    ...(resources.data ?? []).map((r) => ({ type: "resource", label: r.title, sub: r.course_code, href: `/resources/${r.id}` })),
  ]);
}
