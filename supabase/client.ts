import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

let browserClient: SupabaseClient | undefined;

/**
 * Browser Supabase client. During SSR, returns a non-persisted client so
 * @supabase/ssr 0.1.x does not touch document/cookies (avoids cookies.get crash).
 */
export function createClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  }

  return browserClient;
}
