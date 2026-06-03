import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '../../../../../supabase/service'
import { recordSubscriptionPayment } from '@/lib/billing/record-subscription-payment'
import { activatePaidSubscription } from '@/lib/subscription/activate-subscription'
import {
  parseIncomingWebhookBody,
  pickString,
} from '@/lib/webhooks/parse-incoming-body'
import { paymentSuccessUrl } from '@/lib/routes/payment-paths'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** KPay server callback (returl). Must be publicly reachable — set KPAY_RETURN_URL on Vercel. */
export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    null

  return NextResponse.json({
    ok: true,
    service: 'kpay-webhook',
    configured: Boolean(
      process.env.KPAY_USERNAME &&
        process.env.KPAY_PASSWORD &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    returnUrl:
      process.env.KPAY_RETURN_URL ??
      (appUrl ? `${appUrl}/api/kpay/webhook` : null),
    redirectUrl: process.env.KPAY_REDIRECT_URL ?? paymentSuccessUrl(appUrl ?? undefined),
    hint: 'KPay POSTs payment results here. Use your production domain, not localhost.',
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await parseIncomingWebhookBody(request)

    const tid = pickString(body, 'tid', 'TID')
    const refid = pickString(body, 'refid', 'REFID', 'refId')
    const momtransactionid = pickString(
      body,
      'momtransactionid',
      'momTransactionId',
      'MOMTRANSACTIONID',
    )
    const payaccount = pickString(body, 'payaccount', 'payAccount', 'PAYACCOUNT')
    const statusid = pickString(body, 'statusid', 'statusId', 'STATUSID')
    const statusdesc = pickString(body, 'statusdesc', 'statusDesc', 'STATUSDESC')

    if (!tid || !refid) {
      console.warn('[kpay/webhook] missing tid/refid', { keys: Object.keys(body) })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('kpay_refid', refid)
      .single()

    if (!transaction) {
      console.warn('[kpay/webhook] transaction not found', { refid })
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    await supabase.from('payment_logs').insert({
      transaction_id: transaction.id,
      event_type: 'webhook',
      payload: body,
    })

    const updateData: Record<string, unknown> = {
      kpay_status_id: statusid,
      kpay_status_desc: statusdesc,
      mom_transaction_id: momtransactionid,
      pay_account: payaccount,
      webhook_received_at: new Date().toISOString(),
    }

    if (statusid === '01') {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
    } else if (statusid === '02') {
      updateData.status = 'failed'
    } else {
      updateData.status = 'processing'
    }

    await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('id', transaction.id)

    if (statusid === '01' && transaction.subscription_id) {
      await activatePaidSubscription(supabase, transaction.subscription_id as string, {
        paymentMethod: 'kpay',
        paymentReference: refid,
      })
      await recordSubscriptionPayment(supabase, transaction.id as string)
    }

    console.info('[kpay/webhook] processed', {
      refid,
      statusid,
      subscriptionId: transaction.subscription_id ?? null,
    })

    return NextResponse.json({ tid, refid, reply: 'OK' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook failed'
    console.error('[kpay/webhook]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
