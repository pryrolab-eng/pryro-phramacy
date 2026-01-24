import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json([])
    
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (!userPharmacy) return NextResponse.json([])
    
    // Fetch both global categories and pharmacy-specific categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_global.eq.true,pharmacy_id.eq.${userPharmacy.pharmacy_id}`)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Categories fetch error:', error)
      return NextResponse.json([])
    }
    return NextResponse.json(categories || [])
  } catch (error) {
    console.error('Categories error:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const body = await request.json()
    
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (!userPharmacy) return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        name: body.name || body.categoryName,
        description: body.description || body.categoryDescription || '',
        is_global: false,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Category insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Category add error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add category' }, { status: 500 })
  }
}
