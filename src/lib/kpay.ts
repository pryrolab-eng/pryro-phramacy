// KPay Payment Gateway Integration
import { createClient } from '../../supabase/server'

export interface KPayPaymentRequest {
  msisdn: string
  email: string
  details: string
  refid: string
  amount: number
  currency?: string
  cname: string
  cnumber: string
  pmethod: 'momo' | 'cc' | 'bank' | 'spenn' | 'smartcash'
  retailerid: string
  returl: string
  redirecturl: string
  bankid: string
  logourl?: string
}

export interface KPayPaymentResponse {
  reply: string
  url?: string
  success: number
  authkey: string
  tid: string
  refid: string
  retcode: number
  momtransactionid?: string
  statusdesc?: string
  statusid?: string
}

export interface KPayStatusCheckRequest {
  tid?: string
  refid?: string
  action: 'checkstatus'
}

export interface KPayWebhookPayload {
  tid: string
  refid: string
  momtransactionid?: string
  payaccount?: string
  statusid: string
  statusdesc: string
}

export class KPayService {
  private baseUrl: string
  private username: string
  private password: string
  private retailerId: string
  private returnUrl: string
  private redirectUrl: string

  constructor() {
    this.baseUrl = process.env.KPAY_BASE_URL || 'https://pay.esicia.com'
    this.username = process.env.KPAY_USERNAME || ''
    this.password = process.env.KPAY_PASSWORD || ''
    this.retailerId = process.env.KPAY_RETAILER_ID || '02'
    this.returnUrl = process.env.KPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/kpay/webhook`
    this.redirectUrl = process.env.KPAY_REDIRECT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64')
    return `Basic ${credentials}`
  }

  async initiatePayment(params: Omit<KPayPaymentRequest, 'retailerid' | 'returl' | 'redirecturl'>): Promise<KPayPaymentResponse> {
    const payload: KPayPaymentRequest = {
      ...params,
      retailerid: this.retailerId,
      returl: this.returnUrl,
      redirecturl: this.redirectUrl,
      currency: params.currency || 'RWF'
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`KPay API error: ${response.statusText}`)
      }

      const data: KPayPaymentResponse = await response.json()
      return data
    } catch (error) {
      console.error('KPay payment initiation error:', error)
      throw error
    }
  }

  async checkTransactionStatus(tid?: string, refid?: string): Promise<KPayPaymentResponse> {
    const payload: KPayStatusCheckRequest = {
      action: 'checkstatus',
      ...(tid && { tid }),
      ...(refid && { refid })
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`KPay API error: ${response.statusText}`)
      }

      const data: KPayPaymentResponse = await response.json()
      return data
    } catch (error) {
      console.error('KPay status check error:', error)
      throw error
    }
  }

  getErrorMessage(retcode: number): string {
    const errorMessages: Record<number, string> = {
      0: 'No error. Transaction being processed',
      401: 'Missing authentication header',
      500: 'Non HTTPS request',
      600: 'Invalid username / password combination',
      601: 'Invalid remote user',
      602: 'Location / IP not whitelisted',
      603: 'Empty parameter - missing required parameters',
      604: 'Unknown retailer',
      605: 'Retailer not enabled',
      606: 'Error processing',
      607: 'Failed mobile money transaction',
      608: 'Used ref id – error uniqueness',
      609: 'Unknown Payment method',
      610: 'Unknown or not enabled Financial institution',
      611: 'Transaction not found'
    }
    return errorMessages[retcode] || 'Unknown error'
  }

  getBankName(bankId: string): string {
    const banks: Record<string, string> = {
      '63510': 'MTN Mobile Money',
      '63514': 'Airtel Money',
      '000': 'Visa/Mastercard',
      '63501': 'Mobicash',
      '63502': 'Spenn',
      '010': 'IMBANK Rwanda',
      '040': 'Bank of Kigali',
      '070': 'GTBank Rwanda',
      '100': 'Ecobank',
      '115': 'Access Bank',
      '130': 'Cogebanque',
      '145': 'Urwego Opportunity Bank',
      '160': 'KCB Rwanda',
      '192': 'Equity Bank',
      '400': 'Banque Populaire du Rwanda',
      '750': 'BRD',
      '800': 'Zigama CSS',
      '900': 'Bank of Africa',
      '950': 'Unguka Bank'
    }
    return banks[bankId] || 'Unknown Bank'
  }
}

export const kpayService = new KPayService()
