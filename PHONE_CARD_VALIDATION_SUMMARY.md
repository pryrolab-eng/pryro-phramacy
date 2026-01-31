# PHONE NUMBER & CARD VALIDATION MODELS

## 📱 PHONE NUMBER MODEL

### Features
- ✅ Rwanda phone number validation (+250 format)
- ✅ Multiple input format support (0788, 788, +250788, 250788)
- ✅ Automatic carrier detection (MTN, Airtel)
- ✅ KPay bank ID mapping (MTN: 63510, Airtel: 63514)
- ✅ Formatted output standardization

### Usage Example
```typescript
const phone = PhoneNumberValidator.validate('0788123456')
// Returns: {
//   raw: '0788123456',
//   formatted: '+250788123456',
//   countryCode: '+250',
//   nationalNumber: '788123456',
//   carrier: 'MTN',
//   isValid: true
// }

const bankId = PhoneNumberValidator.getKPayBankId('0788123456') // '63510'
```

### Supported Carriers
- **MTN**: 788-799 prefixes → Bank ID: 63510
- **Airtel**: 783-787 prefixes → Bank ID: 63514

## 💳 CARD MODEL

### Features
- ✅ Luhn algorithm validation
- ✅ Brand detection (Visa, Mastercard, Amex, Discover)
- ✅ Card number masking for security
- ✅ Expiry date validation
- ✅ CVV validation (3 digits for most, 4 for Amex)
- ✅ Cardholder name validation

### Usage Example
```typescript
const card = CardValidator.validate('4532015112830366')
// Returns: {
//   number: '4532015112830366',
//   maskedNumber: '************0366',
//   brand: 'visa',
//   isValid: true
// }

const fullValidation = CardValidator.validateWithDetails(
  '4532015112830366', '12', '2025', '123', 'John Doe'
)
```

### Supported Card Types
- **Visa**: 4xxx-xxxx-xxxx-xxxx
- **Mastercard**: 5xxx-xxxx-xxxx-xxxx
- **American Express**: 3xxx-xxxxxx-xxxxx
- **Discover**: 6xxx-xxxx-xxxx-xxxx

## 🔗 KPAY INTEGRATION

### Automatic Bank ID Detection
```typescript
// Mobile Money
PhoneNumberValidator.getKPayBankId('0788123456') // '63510' (MTN)
PhoneNumberValidator.getKPayBankId('0783123456') // '63514' (Airtel)

// Card Payments
CardValidator.getKPayBankId() // '000' (All cards)
```

### Enhanced Payment Request
```json
{
  "amount": 25000,
  "paymentMethod": "momo",
  "customerName": "John Doe",
  "customerPhone": "0788123456",  // Auto-validated and formatted
  "customerEmail": "john@example.com"
}
```

### Database Storage
- ✅ Validated phone numbers stored in standard format
- ✅ Card details masked for security (last 4 digits only)
- ✅ Card brand information stored
- ✅ Carrier information for mobile money

## 🛡️ SECURITY FEATURES

### Phone Number Security
- Input sanitization and format standardization
- Carrier verification for fraud prevention
- Rwanda-specific validation rules

### Card Security
- Luhn algorithm validation
- Card number masking (only last 4 digits visible)
- CVV masking in storage
- Expiry date validation
- No sensitive card data stored in plain text

## ✅ INTEGRATION STATUS

The validation models are now integrated into:
- ✅ KPay payment initiation endpoint
- ✅ Database transaction storage
- ✅ Error handling and validation responses
- ✅ Automatic bank ID detection for KPay

**RESULT**: Enhanced payment security and user experience with automatic validation and formatting.