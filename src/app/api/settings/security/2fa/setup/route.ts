import { NextResponse } from 'next/server'
import { requireTwoFactorEnrollment } from '@/lib/security/require-two-factor-enrollment'
import { storeSaveTwoFactorSetup } from '@/lib/db/public-users-store'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function POST() {
  try {
    const gate = await requireTwoFactorEnrollment()
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { user, issuer } = gate.context

    // Generate secret
    const secret = authenticator.generateSecret()
    
    // Get user email for QR code
    const otpauthUrl = authenticator.keyuri(user.email || 'user', issuer, secret)
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauthUrl)
    
    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    await storeSaveTwoFactorSetup(user.id, secret, backupCodes)

    return NextResponse.json({ 
      secret,
      qrCode,
      backupCodes
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}
