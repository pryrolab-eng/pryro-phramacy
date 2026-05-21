// POST /api/saas/usage/increment
// Increment transaction count for a branch after a successful sale.
// Body: { branch_id }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'
import { incrementBranchTx } from '@/lib/saas/subscription-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { branch_id } = await request.json()
    if (!branch_id) {
      return NextResponse.json({ error: 'branch_id is required' }, { status: 400 })
    }

    const admin = createServiceClient()
    const result = await incrementBranchTx(admin, branch_id)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to increment usage'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
