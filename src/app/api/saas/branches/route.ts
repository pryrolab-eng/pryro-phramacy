// GET  /api/saas/branches  — list branches with usage
// POST /api/saas/branches  — create a new branch (checks limit)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
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
import { assertPlatformMultiBranchEnabled } from '@/lib/platform-policy/enforce'
import { platformPolicyErrorResponse } from '@/lib/platform-policy/errors'
import { storeFindMembershipAtPharmacy } from '@/lib/db/pharmacy-users-store'

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await resolveActivePharmacyContext(user.id)
    const pharmacyId = ctx.activePharmacyId
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    const [rawBranches, entitlements, capacity] = await Promise.all([
      getPharmacyBranches(pharmacyId),
      resolvePharmacyEntitlements(pharmacyId),
      getBranchCapacity(pharmacyId),
    ])

    const allowedBranchIds = await getStaffAllowedBranchIds(
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

    const branchesWithUsage = await Promise.all(
      rawBranches.map(async (b) => ({
        ...b,
        usage: await getBranchCurrentUsage(b.id),
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
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const pharmacyId = (await resolveActivePharmacyContext(user.id))
      .activePharmacyId
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const membership = await storeFindMembershipAtPharmacy(user.id, pharmacyId)
    if (!membership || !['pharmacy_owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, phone, email } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })
    }

    await assertPlatformMultiBranchEnabled()

    const { requirePharmacyEntitlement, entitlementErrorResponse } = await import(
      '@/lib/subscription/assert-entitlement'
    )
    try {
      await requirePharmacyEntitlement({
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

    const branch = await createBranch(pharmacyId, {
      name: name.trim(),
      address,
      phone,
      email,
    })

    return NextResponse.json({ branch }, { status: 201 })
  } catch (err) {
    const policy = platformPolicyErrorResponse(err)
    if (policy) {
      return NextResponse.json(policy.body, { status: policy.status })
    }
    const msg = err instanceof Error ? err.message : 'Failed to create branch'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
