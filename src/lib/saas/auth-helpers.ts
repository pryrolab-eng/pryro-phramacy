// ─────────────────────────────────────────────────────────────
// SaaS Auth Helpers
// Server-side utilities for resolving the current user's
// pharmacy context and subscription status.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolved identity for the currently authenticated user.
 */
export interface PharmacyAuthContext {
  userId: string
  pharmacyId: string
  role: string
  branchId: string | null
}

/**
 * Resolve the pharmacy context for a given auth user ID.
 * Returns null if the user has no pharmacy membership.
 */
export async function resolvePharmacyContext(
  supabase: SupabaseClient,
  userId: string
): Promise<PharmacyAuthContext | null> {
  const { data, error } = await supabase
    .from('pharmacy_users')
    .select('pharmacy_id, role, branch_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    userId,
    pharmacyId: data.pharmacy_id as string,
    role: data.role as string,
    branchId: (data.branch_id as string | null) ?? null,
  }
}

/**
 * Check whether a pharmacy's subscription is currently active.
 * Returns false on any error (fail-safe).
 */
export async function isPharmacySubscriptionActive(
  supabase: SupabaseClient,
  pharmacyId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('pharmacy_id', pharmacyId)
      .eq('subscription_type', 'main')
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle()

    return data !== null
  } catch {
    return false
  }
}

/**
 * Create a Supabase service-role admin client.
 * Only call from server-side code (API routes, server actions).
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
