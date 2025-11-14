import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    
    // Get current pharmacy to find owner_id
    const { data: currentPharmacy } = await supabase
      .from('pharmacies')
      .select('owner_id, email')
      .eq('id', params.id)
      .single()
    
    // Update pharmacy information
    const { data: pharmacy, error } = await supabase
      .from('pharmacies')
      .update({
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        license_number: body.license_number,
        subscription_plan: body.subscription_plan,
        owner_name: body.owner_name,
        owner_email: body.owner_email || body.email
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // Update user password if provided
    if (body.new_password && currentPharmacy?.owner_id) {
      try {
        await supabase.auth.admin.updateUserById(currentPharmacy.owner_id, {
          password: body.new_password
        })
      } catch (passwordError) {
        console.error('Password update failed:', passwordError)
        // Continue with pharmacy update even if password update fails
      }
    }

    // Update user email if changed
    if (body.owner_email && body.owner_email !== currentPharmacy?.email && currentPharmacy?.owner_id) {
      try {
        await supabase.auth.admin.updateUserById(currentPharmacy.owner_id, {
          email: body.owner_email
        })
      } catch (emailError) {
        console.error('Email update failed:', emailError)
        // Continue with pharmacy update even if email update fails
      }
    }

    // Update profile if exists
    if (currentPharmacy?.owner_id) {
      try {
        await supabase.from('profiles').upsert({
          id: currentPharmacy.owner_id,
          full_name: body.owner_name,
          email: body.owner_email || body.email,
          phone: body.phone
        })
      } catch (profileError) {
        console.log('Profile update skipped:', profileError)
      }
    }

    return NextResponse.json({ success: true, pharmacy })
  } catch (error) {
    console.error('Error updating pharmacy:', error)
    return NextResponse.json({ success: false, error: 'Failed to update pharmacy' })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
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