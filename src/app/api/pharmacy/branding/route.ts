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
    
    const { data: pharmacy, error } = await supabase
      .from('pharmacies')
      .select('logo_url, primary_color, custom_domain')
      .eq('id', userPharmacy.pharmacy_id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      logoUrl: pharmacy.logo_url || '',
      primaryColor: pharmacy.primary_color || '#3b82f6',
      customDomain: pharmacy.custom_domain || ''
    })
  } catch (error) {
    console.error('Branding fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    
    const updateData: any = {}
    if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl
    if (body.primaryColor) updateData.primary_color = body.primaryColor
    if (body.customDomain !== undefined) updateData.custom_domain = body.customDomain
    
    const { error } = await supabase
      .from('pharmacies')
      .update(updateData)
      .eq('id', userPharmacy.pharmacy_id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Branding update error:', error)
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
  }
}
