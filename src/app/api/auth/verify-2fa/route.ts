import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { authenticator } from 'otplib'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { sessionToken, token } = await request.json()

    if (!sessionToken || !token) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Use service role to query without auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() {
            return (await cookies()).getAll()
          },
          async setAll(cookiesToSet) {
            cookiesToSet.forEach(async ({ name, value, options }) => {
              (await cookies()).set(name, value, options)
            })
          },
        },
      }
    )

    // Get pending session
    const { data: session, error: sessionError } = await supabase
      .from('two_factor_sessions')
      .select('user_id, expires_at')
      .eq('session_token', sessionToken)
      .eq('verified', false)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 400 })
    }

    // Check expiration
    const expiresAt = new Date(session.expires_at)
    const now = new Date()
    console.log('Session expires:', expiresAt, 'Now:', now, 'Expired:', expiresAt < now)
    if (expiresAt < now) {
      return NextResponse.json({ error: 'Session expired' }, { status: 400 })
    }

    // Get user's 2FA secret
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('two_factor_secret, two_factor_backup_codes')
      .eq('id', session.user_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    let isValid = false

    // Check if it's a backup code
    if (userData.two_factor_backup_codes?.includes(token)) {
      isValid = true
      // Remove used backup code
      const updatedCodes = userData.two_factor_backup_codes.filter((code: string) => code !== token)
      await supabase
        .from('users')
        .update({ two_factor_backup_codes: updatedCodes })
        .eq('id', session.user_id)
    } else if (userData.two_factor_secret) {
      // Verify TOTP token
      isValid = authenticator.verify({
        token,
        secret: userData.two_factor_secret
      })
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Mark session as verified
    await supabase
      .from('two_factor_sessions')
      .update({ verified: true })
      .eq('session_token', sessionToken)

    return NextResponse.json({ 
      success: true,
      userId: session.user_id
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
