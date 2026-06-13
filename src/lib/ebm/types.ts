export type EbmLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  taxClass?: "A" | "B" | "C";
};

export type EbmSalePayload = {
  pharmacyId: string;
  pharmacyTin?: string | null;
  receiptNumber: string;
  saleId: string;
  customerName?: string | null;
  paymentMethod?: string | null;
  items: EbmLineItem[];
  subtotal: number;
  vatRate?: number;
};

export type EbmSubmissionResult = {
  ok: boolean;
  mode: "live" | "sandbox" | "disabled";
  ebmNumber?: string;
  qrPayload?: string;
  vatAmount?: number;
  totalAmount?: number;
  raw?: unknown;
  error?: string;
};

export type VsdcClientConfig = {
  baseUrl: string;
  apiKey: string;
  tin?: string | null;
  sandbox?: boolean;
};
