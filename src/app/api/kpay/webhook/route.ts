import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { tid, refid, momtransactionid, payaccount, statusid, statusdesc } = body

    if (!tid || !refid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('kpay_refid', refid)
      .single()

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    await supabase.from('payment_logs').insert({
      transaction_id: transaction.id,
      event_type: 'webhook',
      payload: body
    })

    const updateData: any = {
      kpay_status_id: statusid,
      kpay_status_desc: statusdesc,
      mom_transaction_id: momtransactionid,
      pay_account: payaccount,
      webhook_received_at: new Date().toISOString()
    }

    if (statusid === '01') {
      updateData.status = 'completed'
    } else if (statusid === '02') {
      updateData.status = 'failed'
    } else {
      updateData.status = 'processing'
    }

    await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('id', transaction.id)

    // Activate subscription if payment completed
    if (statusid === '01' && transaction.subscription_id) {
      await supabase
        .from('subscriptions')
        .update({ is_active: true })
        .eq('id', transaction.subscription_id)
    }

    return NextResponse.json({ tid, refid, reply: 'OK' })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
