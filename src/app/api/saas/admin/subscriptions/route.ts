// GET /api/saas/admin/subscriptions
// Super admin: view all subscriptions across all pharmacies.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import { getAllSubscriptions } from '@/lib/saas/subscription-engine'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = await resolveIsAppPlatformAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const status = request.nextUrl.searchParams.get('status') ?? undefined
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50)
    const offset = Number(request.nextUrl.searchParams.get('offset') ?? 0)

    const subscriptions = await getAllSubscriptions({ status, limit, offset })
    return NextResponse.json({ subscriptions })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load subscriptions'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
