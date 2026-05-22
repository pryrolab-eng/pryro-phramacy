import { createClient } from '../../supabase/server'
import { createServiceClient } from '../../supabase/service'
import { resolvePharmacyEntitlements } from './subscription/lifecycle/entitlements'

export async function checkSubscriptionAccess(userId: string) {
  const supabase = await createClient()
  const admin = createServiceClient()

  const { data: userPharmacy } = await supabase
    .from('pharmacy_users')
    .select('pharmacy_id, role')
    .eq('user_id', userId)
    .single()

  if (!userPharmacy) {
    return { hasAccess: false, reason: 'No pharmacy found', status: null }
  }

  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('id, name, status, subscription_plan, subscription_expires_at')
    .eq('id', userPharmacy.pharmacy_id)
    .single()

  if (!pharmacy) {
    return { hasAccess: false, reason: 'Pharmacy not found', status: null }
  }

  if (pharmacy.status === 'suspended') {
    return {
      hasAccess: false,
      reason: 'Subscription expired',
      status: 'suspended',
      pharmacy,
    }
  }

  const ent = await resolvePharmacyEntitlements(admin, userPharmacy.pharmacy_id)

  if (!ent.isAccessAllowed) {
    if (ent.isExpired) {
      await supabase
        .from('pharmacies')
        .update({ status: 'suspended' })
        .eq('id', pharmacy.id)
    }

    return {
      hasAccess: false,
      reason: 'Subscription expired',
      status: ent.lifecycleStatus ?? 'expired',
      expiryDate: ent.expiresAt,
      pharmacy,
    }
  }

  return {
    hasAccess: true,
    status: ent.lifecycleStatus ?? 'active',
    daysLeft: ent.daysRemaining,
    isExpiringSoon: ent.daysRemaining != null && ent.daysRemaining <= 7,
    pharmacy,
    entitlements: ent,
  }
}
