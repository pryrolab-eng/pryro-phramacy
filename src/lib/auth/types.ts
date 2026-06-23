/** Minimal user shape shared by native auth and Supabase Auth adapters. */
export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
};
