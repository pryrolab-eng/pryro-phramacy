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

    // Get products with medication details for POS
    const { data: products, error } = await supabase
      .from('inventory')
      .select(`
        id,
        batch_number,
        quantity_in_stock,
        selling_price,
        expiry_date,
        medications (
          name,
          category
        )
      `)
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .gt('quantity_in_stock', 0)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json([])
    }

    // Format for POS interface
    const formattedProducts = products?.map(item => {
      const today = new Date()
      const expiryDate = new Date(item.expiry_date)
      const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: item.id,
        name: item.medications?.name || 'Unknown Product',
        price: item.selling_price,
        stock: item.quantity_in_stock,
        batch: item.batch_number,
        expiryDate: item.expiry_date,
        daysToExpiry,
        category: item.medications?.category || 'general'
      }
    }) || []

    console.log(`Found ${formattedProducts.length} products for POS`)
    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json([])
  }
}