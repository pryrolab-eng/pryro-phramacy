// Direct validation test
const PhoneNumberValidator = {
  rwandaCarriers: {
    '788': 'MTN', '789': 'MTN', '790': 'MTN', '791': 'MTN',
    '792': 'MTN', '793': 'MTN', '794': 'MTN', '795': 'MTN',
    '796': 'MTN', '797': 'MTN', '798': 'MTN', '799': 'MTN',
    '783': 'Airtel', '784': 'Airtel', '785': 'Airtel', 
    '786': 'Airtel', '787': 'Airtel'
  },

  validate(phoneNumber) {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '')
    
    let formatted = cleaned
    if (cleaned.startsWith('+250')) {
      formatted = cleaned
    } else if (cleaned.startsWith('250')) {
      formatted = '+' + cleaned
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      formatted = '+250' + cleaned.substring(1)
    } else if (cleaned.length === 9) {
      formatted = '+250' + cleaned
    }

    const match = formatted.match(/^\+250([0-9]{9})$/)
    if (!match) {
      return {
        raw: phoneNumber,
        formatted: '',
        countryCode: '',
        nationalNumber: '',
        carrier: undefined,
        isValid: false
      }
    }

    const nationalNumber = match[1]
    const prefix = nationalNumber.substring(0, 3)
    const carrier = this.rwandaCarriers[prefix] || 'Unknown'

    return {
      raw: phoneNumber,
      formatted,
      countryCode: '+250',
      nationalNumber,
      carrier,
      isValid: true
    }
  },

  getKPayBankId(phoneNumber) {
    const validated = this.validate(phoneNumber)
    if (!validated.isValid) return '63510'
    
    switch (validated.carrier) {
      case 'MTN': return '63510'
      case 'Airtel': return '63514'
      default: return '63510'
    }
  }
}

const CardValidator = {
  cardPatterns: {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
  },

  luhnCheck(cardNumber) {
    let sum = 0
    let alternate = false
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let n = parseInt(cardNumber.charAt(i), 10)
      
      if (alternate) {
        n *= 2
        if (n > 9) n = (n % 10) + 1
      }
      
      sum += n
      alternate = !alternate
    }
    
    return sum % 10 === 0
  },

  detectBrand(cardNumber) {
    for (const [brand, pattern] of Object.entries(this.cardPatterns)) {
      if (pattern.test(cardNumber)) return brand
    }
    return 'unknown'
  },

  maskCard(cardNumber) {
    if (cardNumber.length < 4) return cardNumber
    const last4 = cardNumber.slice(-4)
    const masked = '*'.repeat(cardNumber.length - 4)
    return masked + last4
  },

  validate(cardNumber) {
    const cleaned = cardNumber.replace(/[\s\-]/g, '')
    
    if (!this.luhnCheck(cleaned)) {
      return {
        number: '',
        maskedNumber: this.maskCard(cleaned),
        brand: 'unknown',
        isValid: false
      }
    }

    const brand = this.detectBrand(cleaned)
    
    return {
      number: cleaned,
      maskedNumber: this.maskCard(cleaned),
      brand,
      isValid: true
    }
  }
}

console.log('📱 PHONE VALIDATION TESTS')
console.log('=========================')

const phoneTests = [
  '0788123456',    // Valid MTN
  '+250783654321', // Valid Airtel  
  '788123456',     // Valid MTN short
  '250788123456',  // Valid with country code
  'invalid-phone', // Invalid
  '0712345678'     // Invalid prefix
]

phoneTests.forEach(phone => {
  const result = PhoneNumberValidator.validate(phone)
  const bankId = PhoneNumberValidator.getKPayBankId(phone)
  console.log(`${phone} → Valid: ${result.isValid}, Carrier: ${result.carrier}, Bank ID: ${bankId}`)
})

console.log('\n💳 CARD VALIDATION TESTS')
console.log('========================')

const cardTests = [
  '4532015112830366', // Valid Visa
  '5555555555554444', // Valid Mastercard
  '378282246310005',  // Valid Amex
  '1234567890123456', // Invalid Luhn
  '4532-0151-1283-0366' // Valid Visa with dashes
]

cardTests.forEach(card => {
  const result = CardValidator.validate(card)
  console.log(`${card} → Valid: ${result.isValid}, Brand: ${result.brand}, Masked: ${result.maskedNumber}`)
})