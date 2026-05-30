import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendStaffInviteEmail } from '@/lib/email/staff-invite'
import { createServiceClient } from '../../../../supabase/service'
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from '@/lib/subscription/assert-entitlement'
import { generateTemporaryPassword } from '@/lib/staff/temporary-password'
import { buildStaffInviteApiPayload } from '@/lib/staff/staff-invite-response'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()

    if (!body.pharmacy_id) {
      return NextResponse.json({ error: 'pharmacy_id is required' }, { status: 400 })
    }

    const admin = createServiceClient()
    await requirePharmacyEntitlement({
      admin,
      pharmacyId: body.pharmacy_id,
      feature: 'staff.invite',
      limit: 'users',
    })

    const email = String(body.email ?? '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const password =
      typeof body.password === 'string' && body.password.trim().length >= 6
        ? body.password.trim()
        : generateTemporaryPassword()

    const fullName =
      String(body.full_name ?? '').trim() ||
      email.split('@')[0]?.replace(/[._]/g, ' ') ||
      'Team member'

    const pharmacyName =
      String(body.pharmacy_name ?? '').trim() || 'your pharmacy'

    const role = String(body.role ?? 'pharmacist').trim() || 'pharmacist'

    const { data: authUser, error: createUserError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: body.phone,
        },
      })

    if (createUserError) throw createUserError

    const { error: dbError } = await supabase.from('pharmacy_users').insert({
      pharmacy_id: body.pharmacy_id,
      user_id: authUser.user.id,
      role,
    })

    if (dbError) throw dbError

    const emailResult = await sendStaffInviteEmail({
      to: email,
      fullName,
      pharmacyName,
      role,
      temporaryPassword: password,
    })

    return NextResponse.json(
      buildStaffInviteApiPayload({
        email,
        temporaryPassword: password,
        emailResult,
        userId: authUser.user.id,
        messageWhenEmailOk: 'Team member created and invitation email sent',
        messageWhenEmailFailed:
          'Team member created; invitation email could not be sent',
      }),
    )
  } catch (error) {
    const mapped = entitlementErrorResponse(error)
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status })
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create pharmacist',
      },
      { status: 500 }
    )
  }
}
