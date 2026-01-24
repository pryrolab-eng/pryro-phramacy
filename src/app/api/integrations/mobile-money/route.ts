import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
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

    // Get pharmacy's mobile money API key
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('key')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('name', 'Mobile Money API')
      .eq('status', 'Active')
      .single()

    if (!apiKey) {
      return NextResponse.json({ error: 'Mobile Money API key not configured' }, { status: 400 })
    }

    const { amount, phone, provider } = await request.json()
    
    // TODO: Replace with actual mobile money API call using apiKey.key
    // Example: await fetch('https://api.mtn.rw/payment', { headers: { 'Authorization': `Bearer ${apiKey.key}` } })
    
    const payment = {
      transactionId: `MM${Date.now()}`,
      amount,
      phone,
      provider,
      status: 'success',
      reference: `REF${Date.now()}`,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({ success: true, payment })
  } catch (error) {
    return NextResponse.json({ error: 'Mobile money payment failed' }, { status: 500 })
  }
}