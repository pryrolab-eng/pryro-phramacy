import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { data: pharmacy, error } = await supabase
      .from('pharmacies')
      .update({
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        license_number: body.license_number,
        subscription_plan: body.subscription_plan
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, pharmacy })
  } catch (error) {
    console.error('Error updating pharmacy:', error)
    return NextResponse.json({ success: false, error: 'Failed to update pharmacy' })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('pharmacies')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pharmacy:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete pharmacy' })
  }
}