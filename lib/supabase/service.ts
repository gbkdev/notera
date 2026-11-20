import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client with elevated rights. It exists for ONE job: accepting student file uploads into the
 * private "submissions" bucket after the server has validated them. It is never imported by client code
 * (the "server-only" import makes the build fail if it is), and the key has no NEXT_PUBLIC_ prefix.
 */
export const hasServiceKey = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("NO_SERVICE_KEY");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
