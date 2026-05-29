import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: body.name,
        description: body.description,
        is_active: body.status === 'Active'
      })
      .eq('id', id)
      .eq('pharmacy_id', pharmacyId)
      .select()
      .single()
    
    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, category: data })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('pharmacy_id', pharmacyId)
    
    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
  }
}
