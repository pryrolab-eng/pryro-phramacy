// GET /api/saas/admin/invoices
// Super admin: view all subscription invoices across all pharmacies.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify platform admin
    const { data: profile } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createServiceClient()

    const status = request.nextUrl.searchParams.get('status') ?? undefined
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 200)
    const pharmacyId = request.nextUrl.searchParams.get('pharmacy_id') ?? undefined

    let query = admin
      .from('subscription_invoices')
      .select('*, lines:subscription_invoice_lines(*), pharmacies(id, name, email)')
      .order('billing_month', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)
    if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId)

    const { data: invoices, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ invoices: invoices ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load invoices'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
