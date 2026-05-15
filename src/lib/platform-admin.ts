import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Client = SupabaseClient<Database>

/** Legacy: platform staff was modeled as pharmacy_users.role = admin (or superadmin if ever used). */
export function isLegacyPharmacyPlatformRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'superadmin'
}

/**
 * Pryrox platform operator: /superadmin and broad RLS via is_admin / is_superadmin.
 * Prefer public.users.is_platform_admin; still accepts legacy pharmacy_users admin rows.
 */
export async function resolveIsAppPlatformAdmin(
  supabase: Client,
  userId: string,
  primaryPharmacyRole?: string | null
): Promise<boolean> {
  if (isLegacyPharmacyPlatformRole(primaryPharmacyRole)) {
    return true
  }
  const { data, error } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) {
    return false
  }
  return data.is_platform_admin === true
}
