import { NextRequest, NextResponse } from 'next/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { createClient, createServiceClient } from '../../../../../../supabase/server'
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from '@/lib/subscription/assert-entitlement'
import { uploadAndPersistPharmacyLogo } from '@/lib/pharmacy/upload-pharmacy-logo'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const publicUrl = await uploadAndPersistPharmacyLogo(admin, pharmacyId, file)

    return NextResponse.json({
      success: true,
      url: publicUrl,
    })
  } catch (error) {
    const ent = entitlementErrorResponse(error)
    if (ent) {
      return NextResponse.json(ent.body, { status: ent.status })
    }
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload logo' },
      { status: 500 },
    )
  }
}
