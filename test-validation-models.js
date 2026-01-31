// Test Phone Number and Card Validation Models

import { PhoneNumberValidator } from '../src/lib/phone-validator'
import { CardValidator } from '../src/lib/card-validator'

console.log('📱 PHONE NUMBER VALIDATION TESTS')
console.log('================================')

const phoneTests = [
  '+250788123456',
  '0788123456', 
  '788123456',
  '250788123456',
  '+250783654321',
  '0783654321',
  'invalid-phone'
]

phoneTests.forEach(phone => {
  const result = PhoneNumberValidator.validate(phone)
  console.log(`Input: ${phone}`)
  console.log(`  Valid: ${result.isValid}`)
  console.log(`  Formatted: ${result.formatted}`)
  console.log(`  Carrier: ${result.carrier}`)
  console.log(`  KPay Bank ID: ${PhoneNumberValidator.getKPayBankId(phone)}`)
  console.log()
})

console.log('💳 CARD VALIDATION TESTS')
console.log('========================')

const cardTests = [
  '4532015112830366', // Visa
  '5555555555554444', // Mastercard
  '378282246310005',  // Amex
  '6011111111111117', // Discover
  '1234567890123456'  // Invalid
]

cardTests.forEach(card => {
  const result = CardValidator.validate(card)
  console.log(`Card: ${card}`)
  console.log(`  Valid: ${result.isValid}`)
  console.log(`  Brand: ${result.brand}`)
  console.log(`  Masked: ${result.maskedNumber}`)
  console.log(`  KPay Bank ID: ${CardValidator.getKPayBankId()}`)
  console.log()
})

console.log('🔍 FULL CARD VALIDATION TEST')
console.log('============================')

const fullCardTest = CardValidator.validateWithDetails(
  '4532015112830366',
  '12',
  '2025',
  '123',
  'John Doe'
)

console.log('Full validation result:', fullCardTest)

export { PhoneNumberValidator, CardValidator }