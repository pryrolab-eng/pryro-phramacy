// GET  /api/saas/branches  — list branches with usage
// POST /api/saas/branches  — create a new branch (checks limit)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import {
  getPharmacyBranches,
  getBranchCurrentUsage,
  createBranch,
} from '@/lib/saas/subscription-engine'
import { resolveActivePharmacyContext } from '@/lib/pharmacy/active-pharmacy'
import { getStaffAllowedBranchIds } from '@/lib/pharmacy/staff-branch-access'
import { getBranchCapacity } from '@/lib/subscription/branch-addon-capacity'
import { resolvePharmacyEntitlements } from '@/lib/subscription/lifecycle/entitlements'
import { resolveSwitcherBranches } from '@/lib/branches/entitled-branches'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const ctx = await resolveActivePharmacyContext(admin, user.id)
    const pharmacyId = ctx.activePharmacyId
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    const [rawBranches, entitlements, capacity] = await Promise.all([
      getPharmacyBranches(admin, pharmacyId),
      resolvePharmacyEntitlements(admin, pharmacyId),
      getBranchCapacity(admin, pharmacyId),
    ])

    const allowedBranchIds = await getStaffAllowedBranchIds(
      admin,
      user.id,
      pharmacyId,
      ctx.role,
    )

    const entitled = resolveSwitcherBranches({
      branches: rawBranches,
      maxSlots: capacity.totalSlots,
      allowedBranchIds,
      activeBranchId: ctx.activeBranchId,
      accessBlocked: !entitlements.isAccessAllowed,
    })
    const entitledIds = new Set(entitled.map((b) => b.id))

    // Management UI lists every active branch; switcher applies slot limit client-side.
    const branchesWithUsage = await Promise.all(
      rawBranches.map(async (b) => ({
        ...b,
        usage: await getBranchCurrentUsage(admin, b.id),
        over_plan_limit: !entitledIds.has(b.id),
      }))
    )

    return NextResponse.json({
      branches: branchesWithUsage,
      meta: {
        totalActive: rawBranches.length,
        entitledCount: entitled.length,
        entitledSlots: capacity.totalSlots,
        overLimitCount: Math.max(0, rawBranches.length - capacity.totalSlots),
        accessBlocked: !entitlements.isAccessAllowed,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load branches'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const pharmacyId = (await resolveActivePharmacyContext(admin, user.id))
      .activePharmacyId
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: membership } = await admin
      .from('pharmacy_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('pharmacy_id', pharmacyId)
      .eq('is_active', true)
      .maybeSingle()

    if (!membership || !['pharmacy_owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, phone, email } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })
    }

    const { requirePharmacyEntitlement, entitlementErrorResponse } = await import(
      '@/lib/subscription/assert-entitlement'
    )
    try {
      await requirePharmacyEntitlement({
        admin,
        pharmacyId,
        feature: 'branches.create',
        limit: 'branches',
      })
    } catch (entErr) {
      const mapped = entitlementErrorResponse(entErr)
      if (mapped) {
        return NextResponse.json(mapped.body, { status: mapped.status })
      }
      throw entErr
    }

    const branch = await createBranch(admin, pharmacyId, {
      name: name.trim(),
      address,
      phone,
      email,
    })

    return NextResponse.json({ branch }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create branch'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
