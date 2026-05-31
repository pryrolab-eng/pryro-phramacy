import { NextRequest, NextResponse } from 'next/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { createClient } from '../../../../../supabase/server'
import { getEffectiveSubscriptionLabel } from '@/lib/subscription/effective-plan'
import { resolveActivePharmacyContext } from '@/lib/pharmacy/active-pharmacy'
import { createServiceClient } from '../../../../../supabase/service'
import { isPharmacyOwnerRole } from '@/lib/rbac/pharmacy-roles'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: pharmacy, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', pharmacyId)
      .single()
    
    if (error) throw error

    const subscription = await getEffectiveSubscriptionLabel(
      supabase,
      pharmacyId,
      pharmacy.subscription_plan
    )
    
    return NextResponse.json({
      name: pharmacy.name,
      license: pharmacy.license_number,
      location: `${pharmacy.city}, ${pharmacy.province}`,
      phone: pharmacy.phone,
      email: pharmacy.email,
      subscription,
      subscriptionExpiresAt: pharmacy.subscription_expires_at ?? null,
      currency: 'RWF',
      language: 'en'
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
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
    const ctx = await resolveActivePharmacyContext(admin, user.id)

    if (!isPharmacyOwnerRole(ctx.role)) {
      return NextResponse.json(
        { error: 'Only the pharmacy owner can update business settings' },
        { status: 403 },
      )
    }

    const body = await request.json()
    
    if (!body.name || !body.phone || !body.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('pharmacies')
      .update({
        name: body.name,
        phone: body.phone,
        email: body.email,
        city: body.location?.split(',')[0]?.trim(),
        province: body.location?.split(',')[1]?.trim()
      })
      .eq('id', pharmacyId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
