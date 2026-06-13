import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { recordSubscriptionPayment } from '@/lib/billing/record-subscription-payment'
import { activatePaidSubscription } from '@/lib/subscription/activate-subscription'
import { kpayService } from '@/lib/kpay'
import {
  storeFindPaymentTransactionById,
  storeFindPaymentTransactionByKpayRefid,
  storeFindPaymentTransactionByKpayTid,
  storeInsertPaymentLog,
  storeUpdatePaymentTransaction,
} from '@/lib/db/payment-transactions-store'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
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
      transaction = await storeFindPaymentTransactionById(transactionId)
    } else if (refid) {
      transaction = await storeFindPaymentTransactionByKpayRefid(refid)
    } else if (tid) {
      transaction = await storeFindPaymentTransactionByKpayTid(tid)
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const kpayStatus = await kpayService.checkTransactionStatus(
      transaction.kpay_tid ?? '',
      transaction.kpay_refid,
    )

    await storeInsertPaymentLog({
      transactionId: transaction.id,
      eventType: 'status_check',
      response: kpayStatus,
    })

    const updateData: Record<string, unknown> = {
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

    await storeUpdatePaymentTransaction(transaction.id, updateData)

    if (kpayStatus.statusid === '01' && transaction.subscription_id) {
      await activatePaidSubscription(transaction.subscription_id, {
        paymentMethod: 'kpay',
        paymentReference: transaction.kpay_refid,
      })
      await recordSubscriptionPayment(transaction.id)
    }

    return NextResponse.json({
      transaction: {
        ...transaction,
        ...updateData
      },
      kpayStatus
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status check failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
