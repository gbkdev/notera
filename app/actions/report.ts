"use server";

import { cookies } from "next/headers";
import { reportSchema } from "@/lib/report-schema";
import { createPublicClient } from "@/lib/supabase/public";
import type { ActionResult } from "@/lib/types";

/** Anyone can report a file. Only administrators can read reports (enforced by RLS). */
export async function submitReport(values: unknown): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(values);
  if (!parsed.success) {
    if ((values as { website?: string })?.website) return { ok: true }; // bot: pretend it worked
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const jar = await cookies();
  const key = `rpt_${parsed.data.resource_id}`;
  if (jar.get(key)) return { ok: false, error: "You’ve already reported this file. Thanks, an administrator will look at it." };

  const { error } = await createPublicClient().from("reports").insert({
    resource_id: parsed.data.resource_id, reason: parsed.data.reason, message: parsed.data.message,
  });
  if (error) return { ok: false, error: "Couldn’t send your report right now. Please try again later." };

  jar.set(key, "1", { maxAge: 60 * 60 * 24, httpOnly: true, sameSite: "lax", path: "/" });
  return { ok: true };
}
