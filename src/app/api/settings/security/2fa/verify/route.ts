import { NextRequest, NextResponse } from 'next/server'
import { requireTwoFactorEnrollment } from '@/lib/security/require-two-factor-enrollment'
import {
  storeEnableTwoFactor,
  storeGetTwoFactorAuthData,
} from '@/lib/db/public-users-store'
import { authenticator } from 'otplib'

export async function POST(request: NextRequest) {
  try {
    const gate = await requireTwoFactorEnrollment()
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { user } = gate.context

    const { token } = await request.json()

    const userData = await storeGetTwoFactorAuthData(user.id)

    if (!userData?.two_factor_secret) {
      return NextResponse.json({ error: 'No 2FA secret found' }, { status: 400 })
    }

    const isValid = authenticator.verify({
      token,
      secret: userData.two_factor_secret,
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    await storeEnableTwoFactor(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}
