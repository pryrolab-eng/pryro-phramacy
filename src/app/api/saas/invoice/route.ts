// GET  /api/saas/invoice?month=YYYY-MM  — get or generate monthly invoice
// POST /api/saas/invoice                — mark invoice as paid (admin)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { storeFindFirstActiveMembership } from '@/lib/db/pharmacy-users-store'
import { saasListSubscriptionInvoices } from '@/lib/db/saas-engine'
import { generateMonthlyInvoice } from '@/lib/saas/subscription-engine'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await storeFindFirstActiveMembership(user.id)
    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    const month = request.nextUrl.searchParams.get('month') ?? undefined
    const invoices = await saasListSubscriptionInvoices({
      pharmacyId: membership.pharmacy_id,
      month,
    })

    return NextResponse.json({ invoices })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load invoices'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await storeFindFirstActiveMembership(user.id, {
      roles: ['pharmacy_owner', 'admin'],
    })

    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { month } = await request.json()
    const invoice = await generateMonthlyInvoice(membership.pharmacy_id, month)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate invoice'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
