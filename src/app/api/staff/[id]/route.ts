import { NextRequest, NextResponse } from 'next/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pharmacyUserId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await requireSessionPharmacyId(supabase, user.id)
    const admin = createServiceClient()
    const body = await request.json()

    const { data: member, error: memberErr } = await admin
      .from('pharmacy_users')
      .select('id, user_id, pharmacy_id')
      .eq('id', pharmacyUserId)
      .maybeSingle()

    if (memberErr || !member) {
      return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 })
    }

    const authUserId = member.user_id

    const { error: userError } = await admin
      .from('users')
      .update({
        name: body.name,
        full_name: body.name,
        phone: body.phone,
      })
      .eq('id', authUserId)

    if (userError) throw userError

    const pharmacyUpdates: { role?: string; is_active?: boolean } = {}
    if (body.role !== undefined) pharmacyUpdates.role = body.role
    if (body.status !== undefined) {
      pharmacyUpdates.is_active = body.status !== 'inactive'
    }

    if (Object.keys(pharmacyUpdates).length > 0) {
      const { error: roleError } = await admin
        .from('pharmacy_users')
        .update(pharmacyUpdates)
        .eq('id', pharmacyUserId)

      if (roleError) throw roleError
    }

    if (body.password && String(body.password).trim()) {
      const { error: passwordError } = await admin.auth.admin.updateUserById(authUserId, {
        password: body.password,
      })
      if (passwordError) {
        console.error('Password update error:', passwordError)
        return NextResponse.json({ success: false, error: 'Failed to update password' })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json({ success: false, error: 'Failed to update staff member' })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pharmacyUserId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await requireSessionPharmacyId(supabase, user.id)
    const admin = createServiceClient()

    const { error: pharmacyUserError } = await admin
      .from('pharmacy_users')
      .delete()
      .eq('id', pharmacyUserId)

    if (pharmacyUserError) throw pharmacyUserError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete staff member' })
  }
}
