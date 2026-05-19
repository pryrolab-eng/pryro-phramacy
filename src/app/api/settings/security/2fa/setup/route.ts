import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../supabase/server'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate secret
    const secret = authenticator.generateSecret()
    
    // Get user email for QR code
    const otpauthUrl = authenticator.keyuri(user.email || 'user', 'Pryrox Pharmacy', secret)
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauthUrl)
    
    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    // Store secret (not enabled yet)
    const { error } = await supabase
      .from('users')
      .update({
        two_factor_secret: secret,
        two_factor_backup_codes: backupCodes
      })
      .eq('id', user.id)

    if (error) throw error

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
