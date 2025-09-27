import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'Test Pharmacy',
    license: 'LIC-TEST-001',
    location: 'Kigali, Rwanda',
    phone: '+250788123456',
    email: 'test@pharmacy.com',
    subscription: 'standard'
  })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update pharmacy info' })
  }
}