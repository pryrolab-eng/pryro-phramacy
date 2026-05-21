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

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: membership } = await admin
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    const branches = await getPharmacyBranches(admin, membership.pharmacy_id)
    const branchesWithUsage = await Promise.all(
      branches.map(async (b) => ({
        ...b,
        usage: await getBranchCurrentUsage(admin, b.id),
      }))
    )

    return NextResponse.json({ branches: branchesWithUsage })
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
    const { data: membership } = await admin
      .from('pharmacy_users')
      .select('pharmacy_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('role', ['pharmacy_owner', 'admin'])
      .limit(1)
      .maybeSingle()

    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, phone, email } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })
    }

    const branch = await createBranch(admin, membership.pharmacy_id, {
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
