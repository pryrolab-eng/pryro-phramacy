import { NextRequest, NextResponse } from 'next/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: settings } = await supabase
      .from('pharmacy_settings')
      .select('setting_value')
      .eq('pharmacy_id', pharmacyId)
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

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { error } = await supabase
      .from('pharmacy_settings')
      .upsert({
        pharmacy_id: pharmacyId,
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
