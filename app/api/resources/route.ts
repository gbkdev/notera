import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { UUID_RE } from "@/lib/utils";
import type { Resource } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Looks up public resources by id (used by the Saved page). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter((x) => UUID_RE.test(x)).slice(0, 60);
  if (ids.length === 0) return NextResponse.json([]);
  const { data, error } = await createPublicClient().from("resource_details").select("*").in("id", ids);
  if (error) return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  const order = new Map(ids.map((id, i) => [id, i]));
  const sorted = ((data ?? []) as Resource[]).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return NextResponse.json(sorted, { headers: { "Cache-Control": "no-store" } });
}
