import { NextRequest, NextResponse } from 'next/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { createClient } from '../../../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: whitelist } = await supabase
      .from('ip_whitelist')
      .select('*')
      .eq('pharmacy_id', pharmacyId)

    return NextResponse.json({ ips: whitelist || [] })
  } catch (error) {
    console.error('IP whitelist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch IP whitelist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ip, description } = await request.json()

    if (!ip) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data, error } = await supabase
      .from('ip_whitelist')
      .insert({
        pharmacy_id: pharmacyId,
        ip_address: ip,
        description: description || ''
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, ip: data })
  } catch (error) {
    console.error('IP whitelist add error:', error)
    return NextResponse.json({ error: 'Failed to add IP' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'IP ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ip_whitelist')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('IP whitelist delete error:', error)
    return NextResponse.json({ error: 'Failed to delete IP' }, { status: 500 })
  }
}
