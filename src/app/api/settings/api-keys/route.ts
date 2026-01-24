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
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(apiKeys || [])
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy, error: pharmacyError } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (pharmacyError || !userPharmacy) {
      console.error('Pharmacy lookup error:', pharmacyError)
      return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    }

    const body = await request.json()
    
    if (!body.name || !body.key) {
      return NextResponse.json({ success: false, error: 'Name and key are required' }, { status: 400 })
    }
    
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        name: body.name,
        key_hash: body.key,
        key_prefix: body.key.substring(0, 8),
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }
    return NextResponse.json({ success: true, apiKey })
  } catch (error: any) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to create API key' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const { error } = await supabase
      .from('api_keys')
      .update({
        name: body.name,
        key_hash: body.key,
        key_prefix: body.key.substring(0, 8),
        is_active: body.status === 'Active'
      })
      .eq('id', body.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json({ success: false, error: 'Failed to update API key' }, { status: 500 })
  }
}
