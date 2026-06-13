// GET /api/saas/usage/check?branch_id=xxx
// Check if a branch can make a transaction (before sale).

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { checkBranchCanTransact } from '@/lib/saas/subscription-engine'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const branchId = request.nextUrl.searchParams.get('branch_id')
    if (!branchId) {
      return NextResponse.json({ error: 'branch_id is required' }, { status: 400 })
    }

    const result = await checkBranchCanTransact(branchId)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Usage check failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
