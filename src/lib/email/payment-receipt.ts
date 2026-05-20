import { authEmailLayout } from "./templates";

export function paymentReceiptEmailHtml(params: {
  pharmacyName: string;
  planName: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  paymentMethod: string;
  paidAt: string;
}): string {
  const amountLabel = `${params.amount.toLocaleString()} ${params.currency}`;
  return authEmailLayout(
    "Payment received",
    `<p>Thank you — your subscription payment for <strong>${params.pharmacyName}</strong> was successful.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
       <tr><td style="padding:6px 0;color:#666;">Plan</td><td style="padding:6px 0;text-align:right;"><strong>${params.planName}</strong></td></tr>
       <tr><td style="padding:6px 0;color:#666;">Amount</td><td style="padding:6px 0;text-align:right;"><strong>${amountLabel}</strong></td></tr>
       <tr><td style="padding:6px 0;color:#666;">Method</td><td style="padding:6px 0;text-align:right;">${params.paymentMethod}</td></tr>
       <tr><td style="padding:6px 0;color:#666;">Invoice</td><td style="padding:6px 0;text-align:right;">${params.invoiceNumber}</td></tr>
       <tr><td style="padding:6px 0;color:#666;">Date</td><td style="padding:6px 0;text-align:right;">${params.paidAt}</td></tr>
     </table>
     <p>You can view billing history anytime in <strong>Settings → Billing</strong>.</p>`
  );
}
