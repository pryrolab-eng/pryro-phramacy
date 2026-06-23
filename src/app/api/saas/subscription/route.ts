// GET /api/saas/subscription
// Returns the full subscription summary for the current pharmacy owner.

import { NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { storeFindFirstActiveMembership } from '@/lib/db/pharmacy-users-store'
import { getPharmacySubscriptionSummary } from '@/lib/saas/subscription-engine'

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await storeFindFirstActiveMembership(user.id)
    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    const summary = await getPharmacySubscriptionSummary(membership.pharmacy_id)
    return NextResponse.json({ summary })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load subscription'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
