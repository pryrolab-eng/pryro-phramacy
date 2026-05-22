import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendStaffWelcomeEmail } from '@/lib/email/subscription-emails'

export async function POST(request: Request) {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()

    if (!body.pharmacy_id) {
      return NextResponse.json({ error: 'pharmacy_id is required' }, { status: 400 })
    }

    // ── User limit check ──────────────────────────────────
    // Accept both 'active' and 'trialing' subscriptions
    const { data: mainSub } = await admin
      .from('subscriptions')
      .select('plan_id, plan:subscription_plans!plan_id(max_users)')
      .eq('pharmacy_id', body.pharmacy_id)
      .eq('subscription_type', 'main')
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle()

    if (mainSub) {
      const maxUsers = (mainSub.plan as { max_users?: number } | null)?.max_users ?? null

      if (maxUsers !== null) {
        const { count: currentCount } = await admin
          .from('pharmacy_users')
          .select('id', { count: 'exact', head: true })
          .eq('pharmacy_id', body.pharmacy_id)
          .eq('is_active', true)

        const used = currentCount ?? 0

        if (used >= maxUsers) {
          return NextResponse.json(
            {
              error: `User limit reached. Your current plan allows ${maxUsers} staff member${maxUsers !== 1 ? 's' : ''}. You have ${used}. Upgrade your plan to add more staff.`,
              code: 'USER_LIMIT_REACHED',
              used,
              limit: maxUsers,
            },
            { status: 403 }
          )
        }
      }
    }
    // ── End user limit check ──────────────────────────────

    // ── Resolve pharmacy owner info for the welcome email ─
    const { data: pharmacy } = await admin
      .from('pharmacies')
      .select('name, email, owner_id')
      .eq('id', body.pharmacy_id)
      .maybeSingle()

    const pharmacyName: string = (pharmacy?.name as string) ?? 'Your Pharmacy'

    // Get owner's name + email (3-step fallback)
    let ownerEmail: string = (pharmacy?.email as string | null)?.trim() ?? ''
    let ownerName = 'Pharmacy Manager'

    if (!ownerEmail) {
      const { data: ownerMember } = await admin
        .from('pharmacy_users')
        .select('user_id')
        .eq('pharmacy_id', body.pharmacy_id)
        .eq('role', 'pharmacy_owner')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      const ownerUserId: string | null =
        (ownerMember?.user_id as string | null) ??
        (pharmacy?.owner_id as string | null) ??
        null

      if (ownerUserId) {
        const { data: authUser } = await admin.auth.admin.getUserById(ownerUserId)
        ownerEmail = authUser?.user?.email?.trim() ?? ''
        ownerName =
          (authUser?.user?.user_metadata?.full_name as string | undefined)?.trim() ||
          ownerEmail.split('@')[0] ||
          'Pharmacy Manager'
      }
    }
    // ── End owner resolution ──────────────────────────────

    // Create user in Supabase Auth
    const { data: authUser, error: createUserError } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
        phone: body.phone,
      },
    })

    if (createUserError) throw createUserError

    // Add to pharmacy_users table
    const { error: dbError } = await admin
      .from('pharmacy_users')
      .insert({
        pharmacy_id: body.pharmacy_id,
        user_id: authUser.user.id,
        role: body.role || 'pharmacist',
      })
      .select()
      .single()

    if (dbError) {
      // Roll back the auth user if DB insert fails
      await admin.auth.admin.deleteUser(authUser.user.id)
      throw dbError
    }

    // ── Send welcome email to the new staff member ────────
    // Non-blocking — failure does not affect the response
    if (body.email && body.password) {
      void sendStaffWelcomeEmail({
        to: body.email,
        staffName: body.full_name ?? '',
        pharmacyName,
        password: body.password,
        role: body.role || 'pharmacist',
        ownerName,
        ownerEmail: ownerEmail || (process.env.SMTP_USER ?? ''),
      })
    }
    // ── End welcome email ─────────────────────────────────

    return NextResponse.json({
      success: true,
      message: 'Pharmacist created successfully',
      userId: authUser.user.id,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create pharmacist'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
