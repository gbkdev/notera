import { createBrowserClient } from "@supabase/ssr";

/** Browser client (public anon key only). Used for live updates; it can only see what the database policies allow. */
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
