import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json([])
    
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .or(
        `pharmacy_id.is.null,pharmacy_id.eq.${pharmacyId}`,
      )
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
    
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        pharmacy_id: pharmacyId,
        name: body.name || body.categoryName,
        description: body.description || body.categoryDescription || '',
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
