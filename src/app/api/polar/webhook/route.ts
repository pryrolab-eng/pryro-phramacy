import { NextRequest, NextResponse } from 'next/server'
import { polar } from '@/lib/polar'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'

const getServiceClient = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headers = Object.fromEntries(request.headers.entries())

  let event: ReturnType<typeof validateEvent>
  try {
    event = validateEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET!)
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  const db = getServiceClient()

  try {
    switch (event.type) {
      case 'checkout.created':
      case 'checkout.updated': {
        const checkout = event.data
        if (checkout.status === 'succeeded' && checkout.metadata?.userId) {
          const userId = checkout.metadata.userId as string
          const plan = (checkout.metadata.plan as string) || 'starter'

          // Find the pharmacy for this user
          const { data: membership } = await db
            .from('pharmacy_users')
            .select('pharmacy_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single()

          if (membership?.pharmacy_id) {
            const expiresAt = new Date()
            expiresAt.setFullYear(expiresAt.getFullYear() + 1)

            // Update pharmacy subscription
            await db
              .from('pharmacies')
              .update({
                subscription_plan: plan,
                subscription_expires_at: expiresAt.toISOString(),
                status: 'active',
              })
              .eq('id', membership.pharmacy_id)

            // Upsert subscription record
            await db.from('subscriptions').upsert(
              {
                pharmacy_id: membership.pharmacy_id,
                plan_name: plan,
                polar_checkout_id: checkout.id,
                is_active: true,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'pharmacy_id' }
            )
          }
        }
        break
      }

      case 'subscription.created':
      case 'subscription.updated': {
        const sub = event.data
        const userId = sub.metadata?.userId as string | undefined
        if (!userId) break

        const { data: membership } = await db
          .from('pharmacy_users')
          .select('pharmacy_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (membership?.pharmacy_id) {
          const isActive = sub.status === 'active'
          const expiresAt = sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd).toISOString()
            : null

          await db
            .from('pharmacies')
            .update({
              status: isActive ? 'active' : 'suspended',
              subscription_expires_at: expiresAt,
            })
            .eq('id', membership.pharmacy_id)

          await db.from('subscriptions').upsert(
            {
              pharmacy_id: membership.pharmacy_id,
              polar_subscription_id: sub.id,
              is_active: isActive,
              expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'pharmacy_id' }
          )
        }
        break
      }

      case 'subscription.canceled':
      case 'subscription.revoked': {
        const sub = event.data
        const userId = sub.metadata?.userId as string | undefined
        if (!userId) break

        const { data: membership } = await db
          .from('pharmacy_users')
          .select('pharmacy_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (membership?.pharmacy_id) {
          await db
            .from('pharmacies')
            .update({ status: 'suspended' })
            .eq('id', membership.pharmacy_id)

          await db
            .from('subscriptions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('pharmacy_id', membership.pharmacy_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
