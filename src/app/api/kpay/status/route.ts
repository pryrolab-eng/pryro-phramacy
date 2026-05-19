import { NextRequest, NextResponse } from 'next/server'
import { recordSubscriptionPayment } from '@/lib/billing/record-subscription-payment'
import { createClient } from '../../../../../supabase/server'
import { createServiceClient } from '../../../../../supabase/service'
import { kpayService } from '@/lib/kpay'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tid = searchParams.get('tid')
    const refid = searchParams.get('refid')
    const transactionId = searchParams.get('transactionId')

    if (!tid && !refid && !transactionId) {
      return NextResponse.json({ error: 'Missing transaction identifier' }, { status: 400 })
    }

    let transaction
    if (transactionId) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()
      transaction = data
    } else if (refid) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('kpay_refid', refid)
        .single()
      transaction = data
    } else if (tid) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('kpay_tid', tid)
        .single()
      transaction = data
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const kpayStatus = await kpayService.checkTransactionStatus(
      transaction.kpay_tid,
      transaction.kpay_refid
    )

    await supabase.from('payment_logs').insert({
      transaction_id: transaction.id,
      event_type: 'status_check',
      response: kpayStatus
    })

    const updateData: any = {
      kpay_status_desc: kpayStatus.statusdesc
    }

    if (kpayStatus.statusid === '01') {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
      updateData.kpay_status_id = kpayStatus.statusid
      updateData.mom_transaction_id = kpayStatus.momtransactionid
    } else if (kpayStatus.statusid === '02') {
      updateData.status = 'failed'
      updateData.kpay_status_id = kpayStatus.statusid
    } else if (kpayStatus.statusid === '03') {
      updateData.status = 'processing'
      updateData.kpay_status_id = kpayStatus.statusid
    }

    await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('id', transaction.id)

    // Activate subscription if payment completed
    if (kpayStatus.statusid === '01' && transaction.subscription_id) {
      await supabase
        .from('subscriptions')
        .update({ is_active: true })
        .eq('id', transaction.subscription_id)

      const admin = createServiceClient()
      await recordSubscriptionPayment(admin, transaction.id as string)
    }

    return NextResponse.json({
      transaction: {
        ...transaction,
        ...updateData
      },
      kpayStatus
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
