// POST /api/saas/admin/reset-usage
// Super admin: manually trigger monthly usage reset.

import { NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { rpcResetMonthlyBranchUsage } from '@/lib/db/saas-rpc'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = await resolveIsAppPlatformAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resetCount = await rpcResetMonthlyBranchUsage()
    return NextResponse.json({ reset_count: resetCount })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Reset failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
