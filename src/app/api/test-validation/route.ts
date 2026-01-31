import { NextRequest, NextResponse } from 'next/server'
import { PhoneNumberValidator } from '@/lib/phone-validator'
import { CardValidator } from '@/lib/card-validator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, cardNumber, expiryMonth, expiryYear, cvv, holderName } = body

    const results = {}

    if (phoneNumber) {
      const phoneValidation = PhoneNumberValidator.validate(phoneNumber)
      const bankId = PhoneNumberValidator.getKPayBankId(phoneNumber)
      results.phone = {
        ...phoneValidation,
        kpayBankId: bankId
      }
    }

    if (cardNumber) {
      const cardValidation = CardValidator.validateWithDetails(
        cardNumber, 
        expiryMonth || '', 
        expiryYear || '', 
        cvv || '', 
        holderName || ''
      )
      results.card = {
        ...cardValidation,
        kpayBankId: CardValidator.getKPayBankId()
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}