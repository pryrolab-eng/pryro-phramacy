// GET  /api/saas/invoice?month=YYYY-MM  — get or generate monthly invoice
// POST /api/saas/invoice                — mark invoice as paid (admin)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { generateMonthlyInvoice } from '@/lib/saas/subscription-engine'

export async function GET(request: NextRequest) {
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

    const month = request.nextUrl.searchParams.get('month') ?? undefined

    // Fetch existing invoices for this pharmacy
    let query = admin
      .from('subscription_invoices')
      .select('*, lines:subscription_invoice_lines(*)')
      .eq('pharmacy_id', membership.pharmacy_id)
      .order('billing_month', { ascending: false })

    if (month) query = query.eq('billing_month', month)

    const { data: invoices, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ invoices: invoices ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load invoices'
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

    const { month } = await request.json()
    const invoice = await generateMonthlyInvoice(admin, membership.pharmacy_id, month)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate invoice'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
