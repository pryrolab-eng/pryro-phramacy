import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from '@/lib/rbac/require-pharmacy-permission'
import { PHARMACY_PERMISSIONS } from '@/lib/rbac/permissions'

/** GET/PUT branch access for a pharmacy_users row (staff member). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: pharmacyUserId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const admin = createServiceClient()

    const { data: member } = await admin
      .from('pharmacy_users')
      .select('id, pharmacy_id, role')
      .eq('id', pharmacyUserId)
      .maybeSingle()

    if (!member || member.pharmacy_id !== pharmacyId) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const { data: rows } = await admin
      .from('staff_branch_assignments')
      .select('branch_id')
      .eq('pharmacy_user_id', pharmacyUserId)

    return NextResponse.json({
      pharmacyUserId,
      branchIds: (rows ?? []).map((r) => r.branch_id),
      unrestricted: !(rows ?? []).length,
    })
  } catch (error) {
    console.error('GET staff branches', error)
    return NextResponse.json({ error: 'Failed to load branch access' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: pharmacyUserId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requirePharmacyPermission(user.id, PHARMACY_PERMISSIONS.staffManage)
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const admin = createServiceClient()

    const { data: member } = await admin
      .from('pharmacy_users')
      .select('id, pharmacy_id')
      .eq('id', pharmacyUserId)
      .maybeSingle()

    if (!member || member.pharmacy_id !== pharmacyId) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const body = await request.json()
    const branchIds = Array.isArray(body.branchIds)
      ? (body.branchIds as string[]).filter((id) => typeof id === 'string')
      : []

    if (branchIds.length > 0) {
      const { data: validBranches } = await admin
        .from('branches')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .in('id', branchIds)

      if ((validBranches ?? []).length !== branchIds.length) {
        return NextResponse.json({ error: 'Invalid branch id' }, { status: 400 })
      }
    }

    await admin
      .from('staff_branch_assignments')
      .delete()
      .eq('pharmacy_user_id', pharmacyUserId)

    if (branchIds.length > 0) {
      const { error: insertErr } = await admin.from('staff_branch_assignments').insert(
        branchIds.map((branch_id) => ({ pharmacy_user_id: pharmacyUserId, branch_id })),
      )
      if (insertErr) throw insertErr
    }

    return NextResponse.json({
      success: true,
      branchIds,
      unrestricted: branchIds.length === 0,
    })
  } catch (error) {
    const forbidden = permissionErrorResponse(error)
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status })
    }
    console.error('PUT staff branches', error)
    return NextResponse.json({ error: 'Failed to update branch access' }, { status: 500 })
  }
}
