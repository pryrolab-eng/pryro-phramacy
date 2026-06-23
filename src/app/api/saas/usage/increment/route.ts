// POST /api/saas/usage/increment
// Increment transaction count for a branch after a successful sale.
// Body: { branch_id }

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { incrementBranchTx } from '@/lib/saas/subscription-engine'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { branch_id } = await request.json()
    if (!branch_id) {
      return NextResponse.json({ error: 'branch_id is required' }, { status: 400 })
    }

    const result = await incrementBranchTx(branch_id)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to increment usage'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
