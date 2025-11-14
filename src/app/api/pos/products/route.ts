import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json([])
    }

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json([])
    }

    // Get products for this pharmacy only
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)

    return NextResponse.json(products || [])
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json([])
  }
}
