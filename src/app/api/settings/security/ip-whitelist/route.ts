import { NextRequest, NextResponse } from 'next/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { createClient } from '../../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabled } = await request.json()

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { error } = await supabase
      .from('security_settings')
      .upsert({
        pharmacy_id: pharmacyId,
        ip_whitelist_enabled: enabled
      })

    if (error) throw error

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error('IP whitelist toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle IP whitelist' }, { status: 500 })
  }
}
