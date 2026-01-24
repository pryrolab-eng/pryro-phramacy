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

    // Get pharmacy's RRA EBM API key
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('key')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('name', 'RRA EBM API')
      .eq('status', 'Active')
      .single()

    if (!apiKey) {
      return NextResponse.json({ error: 'RRA EBM API key not configured' }, { status: 400 })
    }

    const { invoice, items, customer } = await request.json()
    
    // TODO: Replace with actual RRA EBM API call using apiKey.key
    // Example: await fetch('https://ebm.rra.gov.rw/api/invoice', { headers: { 'Authorization': apiKey.key } })
    
    const submission = {
      invoiceNumber: invoice,
      ebmNumber: `EBM${Date.now()}`,
      status: 'submitted',
      vatAmount: items.reduce((sum: number, item: any) => sum + (item.price * 0.18), 0),
      totalAmount: items.reduce((sum: number, item: any) => sum + item.price, 0),
      submissionTime: new Date().toISOString()
    }
    
    return NextResponse.json({ success: true, submission })
  } catch (error) {
    return NextResponse.json({ error: 'RRA EBM submission failed' }, { status: 500 })
  }
}