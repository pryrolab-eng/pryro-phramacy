// Phone Number Validation Model for KPay Integration
export interface PhoneNumberModel {
  raw: string
  formatted: string
  countryCode: string
  nationalNumber: string
  carrier?: string
  isValid: boolean
}

export class PhoneNumberValidator {
  private static rwandaCarriers = {
    '788': 'MTN',
    '789': 'MTN', 
    '790': 'MTN',
    '791': 'MTN',
    '792': 'MTN',
    '793': 'MTN',
    '794': 'MTN',
    '795': 'MTN',
    '796': 'MTN',
    '797': 'MTN',
    '798': 'MTN',
    '799': 'MTN',
    '783': 'Airtel',
    '784': 'Airtel',
    '785': 'Airtel',
    '786': 'Airtel',
    '787': 'Airtel'
  }

  static validate(phoneNumber: string): PhoneNumberModel {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '')
    
    // Handle different formats
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
  }

  static getKPayBankId(phoneNumber: string): string {
    const validated = this.validate(phoneNumber)
    if (!validated.isValid) return '63510' // Default MTN
    
    switch (validated.carrier) {
      case 'MTN': return '63510'
      case 'Airtel': return '63514'
      default: return '63510'
    }
  }
}