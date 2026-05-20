import { NextRequest, NextResponse } from 'next/server'
import { polar, POLAR_PLANS, type PolarPlan } from '@/lib/polar'
import { createClient } from '../../../../../supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const { searchParams } = new URL(request.url)
    const plan = searchParams.get('plan') as PolarPlan

    if (!plan || !POLAR_PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const productId = POLAR_PLANS[plan].productId
    if (!productId) {
      return NextResponse.json(
        { error: `Product ID for plan "${plan}" is not configured. Set NEXT_PUBLIC_POLAR_PRODUCT_ID_${plan.toUpperCase()} in your environment.` },
        { status: 500 }
      )
    }

    const checkout = await polar.checkouts.create({
      productId,
      customerEmail: user.email,
      metadata: {
        userId: user.id,
        plan,
      },
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?checkout_id={CHECKOUT_ID}`,
    })

    return NextResponse.redirect(checkout.url)
  } catch (error: any) {
    console.error('Polar checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
