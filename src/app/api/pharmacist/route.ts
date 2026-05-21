import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '../../../../supabase/server'

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
    // 1. Get the active main subscription plan for this pharmacy
    const { data: mainSub } = await admin
      .from('subscriptions')
      .select('plan_id, plan:subscription_plans(max_users)')
      .eq('pharmacy_id', body.pharmacy_id)
      .eq('subscription_type', 'main')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (mainSub) {
      const maxUsers = (mainSub.plan as { max_users?: number } | null)?.max_users ?? null

      if (maxUsers !== null) {
        // 2. Count current active staff
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
