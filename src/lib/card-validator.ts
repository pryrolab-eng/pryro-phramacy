// Card Validation Model
export interface CardModel {
  number: string
  maskedNumber: string
  brand: string
  isValid: boolean
  expiryMonth?: string
  expiryYear?: string
  cvv?: string
  holderName?: string
}

export class CardValidator {
  private static cardPatterns = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
  }

  static validate(cardNumber: string): CardModel {
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

  static validateWithDetails(
    cardNumber: string,
    expiryMonth: string,
    expiryYear: string,
    cvv: string,
    holderName: string
  ): CardModel {
    const cardValidation = this.validate(cardNumber)
    
    const isExpiryValid = this.validateExpiry(expiryMonth, expiryYear)
    const isCvvValid = this.validateCvv(cvv, cardValidation.brand)
    const isNameValid = holderName.trim().length >= 2

    return {
      ...cardValidation,
      expiryMonth,
      expiryYear,
      cvv: cvv.replace(/./g, '*'),
      holderName,
      isValid: cardValidation.isValid && isExpiryValid && isCvvValid && isNameValid
    }
  }

  private static luhnCheck(cardNumber: string): boolean {
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
  }

  private static detectBrand(cardNumber: string): string {
    for (const [brand, pattern] of Object.entries(this.cardPatterns)) {
      if (pattern.test(cardNumber)) return brand
    }
    return 'unknown'
  }

  private static maskCard(cardNumber: string): string {
    if (cardNumber.length < 4) return cardNumber
    const last4 = cardNumber.slice(-4)
    const masked = '*'.repeat(cardNumber.length - 4)
    return masked + last4
  }

  private static validateExpiry(month: string, year: string): boolean {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    const expMonth = parseInt(month, 10)
    const expYear = parseInt(year, 10)
    
    if (expMonth < 1 || expMonth > 12) return false
    if (expYear < currentYear) return false
    if (expYear === currentYear && expMonth < currentMonth) return false
    
    return true
  }

  private static validateCvv(cvv: string, brand: string): boolean {
    if (brand === 'amex') return /^[0-9]{4}$/.test(cvv)
    return /^[0-9]{3}$/.test(cvv)
  }


}