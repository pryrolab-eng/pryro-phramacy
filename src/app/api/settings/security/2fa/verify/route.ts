import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../../supabase/server'
import { authenticator } from 'otplib'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    // Get user's secret
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('two_factor_secret')
      .eq('id', user.id)
      .single()

    if (fetchError || !userData?.two_factor_secret) {
      return NextResponse.json({ error: 'No 2FA secret found' }, { status: 400 })
    }

    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: userData.two_factor_secret
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Enable 2FA
    const { error } = await supabase
      .from('users')
      .update({ two_factor_enabled: true })
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}
