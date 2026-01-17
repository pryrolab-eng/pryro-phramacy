import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()
    
    if (!userPharmacy) return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: body.name,
        description: body.description,
        is_active: body.status === 'Active'
      })
      .eq('id', params.id)
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()
    
    if (!userPharmacy) return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', params.id)
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
    
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
