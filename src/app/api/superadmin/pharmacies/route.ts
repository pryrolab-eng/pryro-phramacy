import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requirePlatformAdminApi } from '@/lib/admin/require-platform-admin'

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const pharmacies = await prisma.pharmacies.findMany({
      orderBy: { created_at: 'desc' },
    })

    const formattedPharmacies = pharmacies.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      phone: p.phone,
      email: p.email,
      subscription_plan: p.subscription_plan,
      owner_name: p.owner_id,
      status: p.status,
      created_at: p.created_at?.toISOString() ?? null,
    }))

    return NextResponse.json(formattedPharmacies)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pharmacies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdminApi()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const pharmacy = await prisma.pharmacies.create({
      data: {
        name: body.name,
        address: body.location,
        phone: body.owner_phone,
        email: body.owner_email,
        subscription_plan: body.plan ?? 'trial',
        license_number: `LIC-${Date.now()}`,
        status: 'active',
      },
    })

    return NextResponse.json({ success: true, pharmacy })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create pharmacy' }, { status: 500 })
  }
}
