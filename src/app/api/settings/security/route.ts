import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const { data: settings } = await supabase
      .from('pharmacy_settings')
      .select('setting_value')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('setting_key', 'security')
      .single()

    return NextResponse.json(settings?.setting_value || { ip_whitelist_enabled: false })
  } catch (error) {
    console.error('Security settings fetch error:', error)
    return NextResponse.json({ ip_whitelist_enabled: false })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const { error } = await supabase
      .from('pharmacy_settings')
      .upsert({
        pharmacy_id: userPharmacy.pharmacy_id,
        setting_key: 'security',
        setting_value: body
      }, {
        onConflict: 'pharmacy_id,setting_key'
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Security settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
