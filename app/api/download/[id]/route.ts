import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { downloadUrl } from "@/lib/storage";
import { UUID_RE } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Counts the download, then sends the visitor to the file. A failed count never blocks the download. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  if (!UUID_RE.test(params.id)) return new NextResponse("Not found", { status: 404 });
  const supabase = createPublicClient();
  const { data: r } = await supabase.from("resources").select("file_path, file_name").eq("id", params.id).maybeSingle();
  if (!r) return new NextResponse("Not found", { status: 404 });

  const res = NextResponse.redirect(downloadUrl(r.file_path, r.file_name), 302);
  // One count per file per browser per hour, so refreshing or double-clicking doesn't inflate the number.
  const key = `dl_${params.id}`;
  if (!(await cookies()).get(key)) {
    try {
      await supabase.rpc("increment_download", { resource_id: params.id });
      res.cookies.set(key, "1", { maxAge: 3600, httpOnly: true, sameSite: "lax", path: "/" });
    } catch { /* ignore */ }
  }
  return res;
}
