import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

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
        name: body.categoryName || body.name,
        description: body.categoryDescription || body.description || '',
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
    console.error('Quick add category error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add category' }, { status: 500 })
  }
}
