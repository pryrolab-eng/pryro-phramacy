// GET /api/saas/usage/check?branch_id=xxx
// Check if a branch can make a transaction (before sale).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'
import { checkBranchCanTransact } from '@/lib/saas/subscription-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const branchId = request.nextUrl.searchParams.get('branch_id')
    if (!branchId) {
      return NextResponse.json({ error: 'branch_id is required' }, { status: 400 })
    }

    const admin = createServiceClient()
    const result = await checkBranchCanTransact(admin, branchId)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Usage check failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
