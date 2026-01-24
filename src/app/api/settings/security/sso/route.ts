import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabled } = await request.json()

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const { error } = await supabase
      .from('security_settings')
      .upsert({
        pharmacy_id: userPharmacy.pharmacy_id,
        sso_enabled: enabled
      })

    if (error) throw error

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error('SSO toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle SSO' }, { status: 500 })
  }
}
