import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { kpayService } from '@/lib/kpay'
import { PhoneNumberValidator } from '@/lib/phone-validator'
import { CardValidator } from '@/lib/card-validator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      amount,
      paymentMethod,
      bankId,
      customerName,
      customerPhone,
      customerEmail,
      saleId,
      subscriptionId,
      details,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv
    } = body

    if (!amount || !paymentMethod || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate phone number
    const phoneValidation = PhoneNumberValidator.validate(customerPhone)
    if (!phoneValidation.isValid && paymentMethod === 'momo') {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Validate card if card payment
    let cardValidation = null
    if (paymentMethod === 'cc' && cardNumber) {
      cardValidation = CardValidator.validateWithDetails(
        cardNumber, expiryMonth || '', expiryYear || '', cvv || '', customerName
      )
      if (!cardValidation.isValid) {
        return NextResponse.json({ error: 'Invalid card details' }, { status: 400 })
      }
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const refid = `PYX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const kpayRequest = {
      msisdn: phoneValidation.formatted.replace(/\+/g, ''),
      email: customerEmail || user.email || 'noreply@pryrox.com',
      details: details || 'Pharmacy payment',
      refid,
      amount: Math.round(amount),
      currency: 'RWF',
      cname: customerName,
      cnumber: phoneValidation.formatted,
      pmethod: paymentMethod as 'momo' | 'cc' | 'bank' | 'spenn' | 'smartcash',
      bankid: bankId || (paymentMethod === 'momo' ? PhoneNumberValidator.getKPayBankId(customerPhone) : 
                        paymentMethod === 'cc' ? CardValidator.getKPayBankId() : '000'),
      logourl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        sale_id: saleId || null,
        subscription_id: subscriptionId || null,
        kpay_refid: refid,
        amount,
        currency: 'RWF',
        payment_method: paymentMethod,
        bank_id: kpayRequest.bankid,
        bank_name: kpayService.getBankName(kpayRequest.bankid),
        customer_name: customerName,
        customer_phone: phoneValidation.formatted,
        customer_email: customerEmail,
        customer_number: phoneValidation.formatted,
        payment_details: details,
        card_last_four: cardValidation?.maskedNumber?.slice(-4) || null,
        card_brand: cardValidation?.brand || null,
        status: 'pending'
      })
      .select()
      .single()

    if (transactionError) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    await supabase.from('payment_logs').insert({
      transaction_id: transaction.id,
      event_type: 'request',
      payload: kpayRequest
    })

    const kpayResponse = await kpayService.initiatePayment(kpayRequest)

    await supabase.from('payment_logs').insert({
      transaction_id: transaction.id,
      event_type: 'response',
      response: kpayResponse
    })

    const updateData: any = {
      kpay_tid: kpayResponse.tid,
      kpay_authkey: kpayResponse.authkey,
      kpay_checkout_url: kpayResponse.url,
      kpay_status_desc: kpayResponse.statusdesc
    }

    if (kpayResponse.retcode === 0) {
      updateData.status = 'processing'
    } else if (kpayResponse.statusid === '01') {
      updateData.status = 'completed'
      updateData.kpay_status_id = kpayResponse.statusid
      updateData.mom_transaction_id = kpayResponse.momtransactionid
    } else {
      updateData.status = 'failed'
      updateData.error_message = kpayService.getErrorMessage(kpayResponse.retcode)
    }

    await supabase.from('payment_transactions').update(updateData).eq('id', transaction.id)

    return NextResponse.json({
      success: kpayResponse.retcode === 0 || kpayResponse.statusid === '01',
      transaction: {
        id: transaction.id,
        refid,
        tid: kpayResponse.tid,
        status: updateData.status,
        checkoutUrl: kpayResponse.url
      },
      kpayResponse
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 })
  }
}
