import { createClient } from "@supabase/supabase-js";

/** Cookie-free anonymous client for places that have no request session (OG images, sitemap, download counter). */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
