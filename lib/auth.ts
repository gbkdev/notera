import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Returns the signed-in administrator, or null. Checks the admin_profiles table, not just the session. */
export async function getAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("admin_profiles").select("full_name").eq("user_id", user.id).maybeSingle();
  if (!profile) return null;
  return { supabase, user, name: profile.full_name as string };
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
