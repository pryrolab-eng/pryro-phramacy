// KPay Payment Gateway Integration
import { paymentSuccessUrl } from "@/lib/routes/payment-paths";

export type KPayPaymentMethod = "momo" | "cc" | "spenn" | "bank" | "smartcash";

export interface KPayPaymentRequest {
  action: "pay";
  msisdn: string;
  email: string;
  details: string;
  refid: string;
  amount: number;
  currency?: string;
  cname: string;
  cnumber: string;
  pmethod: KPayPaymentMethod;
  retailerid: string;
  returl: string;
  redirecturl: string;
  bankid?: string;
  logourl?: string;
}

export interface KPayPaymentResponse {
  reply: string;
  url?: string;
  success: number;
  authkey: string;
  tid: string;
  refid: string;
  retcode: number;
  momtransactionid?: string;
  statusdesc?: string;
  statusmsg?: string;
  statusid?: string;
}

export interface KPayStatusCheckRequest {
  refid: string;
  action: "checkstatus";
}

export interface KPayWebhookPayload {
  tid: string;
  refid: string;
  momtransactionid?: string;
  payaccount?: string;
  statusid: string;
  statusdesc: string;
  statusmsg?: string;
}

export class KPayService {
  private baseUrl: string;
  private apiKey: string;
  private username: string;
  private password: string;
  private retailerId: string;
  private returnUrl: string;
  private redirectUrl: string;

  constructor() {
    this.baseUrl = process.env.KPAY_BASE_URL || "https://pay.esicia.com";
    this.apiKey = process.env.KPAY_API_KEY || "";
    this.username = process.env.KPAY_USERNAME || "";
    this.password = process.env.KPAY_PASSWORD || "";
    this.retailerId = process.env.KPAY_RETAILER_ID || "02";
    this.returnUrl =
      process.env.KPAY_RETURN_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/kpay/webhook`;
    this.redirectUrl = process.env.KPAY_REDIRECT_URL || paymentSuccessUrl();
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString(
      "base64",
    );
    return `Basic ${credentials}`;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: this.getAuthHeader(),
      "Content-Type": "application/json",
      ...(this.apiKey ? { "Kpay-Key": this.apiKey } : {}),
    };
  }

  async initiatePayment(
    params: Omit<
      KPayPaymentRequest,
      "action" | "retailerid" | "returl" | "redirecturl"
    >,
  ): Promise<KPayPaymentResponse> {
    const payload: KPayPaymentRequest = {
      ...params,
      action: "pay",
      retailerid: this.retailerId,
      returl: this.returnUrl,
      redirecturl: this.redirectUrl,
      currency: params.currency || "RWF",
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`KPay API error: ${response.statusText}`);
      }

      return (await response.json()) as KPayPaymentResponse;
    } catch (error) {
      console.error("KPay payment initiation error:", error);
      throw error;
    }
  }

  async checkTransactionStatus(
    _tid: string | undefined,
    refid: string,
  ): Promise<KPayPaymentResponse> {
    const payload: KPayStatusCheckRequest = {
      action: "checkstatus",
      refid,
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`KPay API error: ${response.statusText}`);
      }

      return (await response.json()) as KPayPaymentResponse;
    } catch (error) {
      console.error("KPay status check error:", error);
      throw error;
    }
  }

  getErrorMessage(retcode: number): string {
    const errorMessages: Record<number, string> = {
      0: "Payment initiated, awaiting customer action",
      600: "Missing or invalid payment parameters",
      601: "KPay API key not found or inactive",
      602: "KPay Basic Auth credentials invalid",
      603: "Request IP is not whitelisted by KPay",
      604: "Duplicate payment reference ID",
      605: "Amount is outside the allowed transaction range",
      606: "Payment provider rejected the transaction",
      607: "Customer has insufficient balance",
      608: "Transaction timed out",
      609: "Transaction cancelled by customer",
    };
    return errorMessages[retcode] || "Unknown error";
  }

  getBankName(bankId: string): string {
    const banks: Record<string, string> = {
      "63510": "MTN Mobile Money",
      "63514": "Airtel Money",
      "000": "Visa/Mastercard",
      "63502": "SPENN",
    };
    return banks[bankId] || "Unknown Bank";
  }
}

export const kpayService = new KPayService();
