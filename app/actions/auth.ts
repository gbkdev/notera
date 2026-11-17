"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export async function signInAdmin(values: z.infer<typeof loginSchema>): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Enter your email and password." };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { ok: false, error: "Email or password is incorrect." };

  const { data: profile } = await supabase
    .from("admin_profiles").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account doesn't have administrator access." };
  }
  return { ok: true };
}

export async function signOutAdmin() {
  await createClient().auth.signOut();
}
