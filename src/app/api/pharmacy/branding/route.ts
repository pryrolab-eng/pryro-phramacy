import { NextRequest, NextResponse } from 'next/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from '@/lib/subscription/assert-entitlement'
import {
  loadPharmacyBrandingRow,
  savePharmacyBrandingRow,
} from '@/lib/pharmacy/branding-db'
import { DEFAULT_PHARMACY_BRANDING } from '@/lib/pharmacy/default-branding'
import { resolvePharmacyEntitlements } from '@/lib/subscription/lifecycle/entitlements'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const admin = createServiceClient()
    try {
      const entitlements = await resolvePharmacyEntitlements(admin, pharmacyId)
      if (!entitlements.can('customization')) {
        return NextResponse.json(DEFAULT_PHARMACY_BRANDING)
      }
    } catch (entErr) {
      console.error('GET branding: entitlements check failed', entErr)
      return NextResponse.json(DEFAULT_PHARMACY_BRANDING)
    }

    const branding = await loadPharmacyBrandingRow(supabase, pharmacyId)
    if (!branding) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    return NextResponse.json(branding)
  } catch (error) {
    console.error('Branding fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const admin = createServiceClient()
    await requirePharmacyEntitlement({
      admin,
      pharmacyId,
      feature: 'customization',
    })

    const body = await request.json()
    await savePharmacyBrandingRow(supabase, pharmacyId, body)

    return NextResponse.json({ success: true })
  } catch (error) {
    const ent = entitlementErrorResponse(error)
    if (ent) {
      return NextResponse.json(ent.body, { status: ent.status })
    }
    console.error('Branding update error:', error)
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
  }
}
