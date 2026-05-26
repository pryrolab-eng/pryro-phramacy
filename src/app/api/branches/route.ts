import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'
import { createServiceClient } from '../../../../supabase/service'
import { createBranch } from '@/lib/saas/subscription-engine'
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from '@/lib/subscription/assert-entitlement'
import { getRequestPharmacyId } from '@/lib/subscription/api-guard'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: branches, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const formattedBranches = branches?.map(b => ({
      id: b.id,
      name: b.name,
      location: b.address,
      manager: b.manager_id,
      phone: b.phone,
      email: b.phone,
      status: b.is_active ? 'active' : 'inactive',
      staff_count: 0,
      monthly_sales: 0,
      created_at: b.created_at
    })) || []

    return NextResponse.json(formattedBranches)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await getRequestPharmacyId(supabase, user.id)
    if (!pharmacyId) {
      return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 403 })
    }

    const admin = createServiceClient()
    await requirePharmacyEntitlement({
      admin,
      pharmacyId,
      feature: 'branches.create',
      limit: 'branches',
    })

    const body = await request.json()
    const branch = await createBranch(admin, pharmacyId, {
      name: body.name,
      address: body.location ?? body.address,
      phone: body.phone,
      email: body.email,
    })

    return NextResponse.json({ success: true, branch })
  } catch (error) {
    const mapped = entitlementErrorResponse(error)
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status })
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create branch' },
      { status: 500 },
    )
  }
}
