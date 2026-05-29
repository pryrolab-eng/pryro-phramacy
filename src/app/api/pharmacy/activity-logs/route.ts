import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { guardReportsAccess, entitlementRouteResponse } = await import(
      '@/lib/subscription/route-guards'
    )
    try {
      await guardReportsAccess(supabase, user.id)
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr)
      if (res) return res
      throw entErr
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200)
    const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0)

    const admin = createServiceClient()
    const { data: logs, error } = await admin
      .from('audit_logs')
      .select('id, action, table_name, record_id, old_values, new_values, user_id, created_at')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const userIds = Array.from(
      new Set((logs ?? []).map((l) => l.user_id).filter(Boolean)),
    ) as string[];
    const userLabels: Record<string, string> = {}

    for (const uid of userIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(uid)
      if (authUser?.user) {
        userLabels[uid] =
          authUser.user.user_metadata?.full_name ||
          authUser.user.email?.split('@')[0] ||
          'User'
      }
    }

    const items = (logs ?? []).map((log) => ({
      id: log.id,
      action: log.action,
      tableName: log.table_name,
      recordId: log.record_id,
      userId: log.user_id,
      userLabel: log.user_id ? userLabels[log.user_id] ?? 'User' : 'System',
      createdAt: log.created_at,
      summary: formatAuditSummary(log.action, log.table_name, log.new_values, log.old_values),
    }))

    return NextResponse.json({ items, limit, offset })
  } catch (error) {
    console.error('GET /api/pharmacy/activity-logs', error)
    return NextResponse.json({ items: [], error: 'Failed to load activity' }, { status: 500 })
  }
}

function formatAuditSummary(
  action: string,
  tableName: string | null,
  newValues: unknown,
  oldValues: unknown,
): string {
  const table = tableName ?? 'record'
  if (action === 'INSERT') return `Created ${table}`
  if (action === 'DELETE') return `Deleted ${table}`
  if (action === 'UPDATE') {
    const nv = newValues as Record<string, unknown> | null
    const name = nv?.name ?? nv?.customer_name ?? nv?.receipt_number
    if (name) return `Updated ${table}: ${String(name)}`
    return `Updated ${table}`
  }
  if (oldValues || newValues) return `${action} on ${table}`
  return `${action} ${table}`
}
