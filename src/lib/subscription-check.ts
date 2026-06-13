import { prisma } from "@/lib/db/prisma";
import { resolveActivePharmacyId } from './pharmacy/active-pharmacy'
import { resolvePharmacyEntitlements } from './subscription/lifecycle/entitlements'

export async function checkSubscriptionAccess(userId: string) {
  const pharmacyId = await resolveActivePharmacyId(userId)
  if (!pharmacyId) {
    return { hasAccess: false, reason: 'No pharmacy found', status: null }
  }

  const pharmacy = await prisma.pharmacies.findUnique({
    where: { id: pharmacyId },
    select: {
      id: true,
      name: true,
      status: true,
      subscription_plan: true,
      subscription_expires_at: true,
    },
  })

  if (!pharmacy) {
    return { hasAccess: false, reason: 'Pharmacy not found', status: null }
  }

  if (pharmacy.status === 'suspended') {
    return {
      hasAccess: false,
      reason: 'Subscription expired',
      status: 'suspended',
      pharmacy: {
        ...pharmacy,
        subscription_expires_at:
          pharmacy.subscription_expires_at?.toISOString() ?? null,
      },
    }
  }

  const ent = await resolvePharmacyEntitlements(pharmacyId)

  if (!ent.isAccessAllowed) {
    if (ent.isExpired) {
      await prisma.pharmacies.update({
        where: { id: pharmacy.id },
        data: { status: 'suspended' },
      })
    }

    return {
      hasAccess: false,
      reason: 'Subscription expired',
      status: ent.lifecycleStatus ?? 'expired',
      expiryDate: ent.expiresAt,
      pharmacy: {
        ...pharmacy,
        subscription_expires_at:
          pharmacy.subscription_expires_at?.toISOString() ?? null,
      },
    }
  }

  return {
    hasAccess: true,
    status: ent.lifecycleStatus ?? 'active',
    daysLeft: ent.daysRemaining,
    isExpiringSoon: ent.daysRemaining != null && ent.daysRemaining <= 7,
    pharmacy: {
      ...pharmacy,
      subscription_expires_at:
        pharmacy.subscription_expires_at?.toISOString() ?? null,
    },
    entitlements: ent,
  }
}
