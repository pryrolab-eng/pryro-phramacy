import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { getAllowUserTwoFactor } from '@/lib/platform-security-policy'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const platformAllows = await getAllowUserTwoFactor(supabase)
    const { enabled } = await request.json()

    if (enabled && !platformAllows) {
      return NextResponse.json(
        { error: 'Two-factor authentication is disabled by the platform administrator' },
        { status: 403 },
      )
    }

    // Disable 2FA
    if (!enabled) {
      const { error } = await supabase
        .from('users')
        .update({ 
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_backup_codes: null
        })
        .eq('id', user.id)

      if (error) throw error
      return NextResponse.json({ success: true, enabled: false })
    }

    return NextResponse.json({ error: 'Use /setup endpoint to enable 2FA' }, { status: 400 })
  } catch (error) {
    console.error('2FA toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle 2FA' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const platformAllows = await getAllowUserTwoFactor(supabase)

    const { data, error } = await supabase
      .from('users')
      .select('two_factor_enabled')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      enabled: platformAllows ? Boolean(data?.two_factor_enabled) : false,
      platformAllowsTwoFactor: platformAllows,
    })
  } catch (error) {
    console.error('2FA status error:', error)
    return NextResponse.json({ error: 'Failed to get 2FA status' }, { status: 500 })
  }
}
