import { createClient } from "@supabase/supabase-js";

/** Server-only admin client (bypasses RLS). Use after verifying the user session. */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role credentials are not configured");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
