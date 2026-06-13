import { storeRecordSubscriptionPayment } from "@/lib/db/billing-store";
import { isSmtpConfigured, sendMail } from "@/lib/email/mailer";
import { paymentReceiptEmailHtml } from "@/lib/email/payment-receipt";

/** Idempotent: invoice + payments row + receipt email after subscription payment completes. */
export async function recordSubscriptionPayment(
  transactionId: string,
): Promise<{ recorded: boolean; invoiceId?: string; emailSent?: boolean }> {
  const result = await storeRecordSubscriptionPayment(transactionId);

  if (!result.recorded) {
    return { recorded: false };
  }

  const recipient = result.customerEmail ?? "";
  let emailSent = false;

  if (
    recipient &&
    isSmtpConfigured() &&
    result.planName &&
    result.amount != null &&
    result.currency &&
    result.invoiceNumber &&
    result.paymentMethodLabel &&
    result.paidAt
  ) {
    try {
      await sendMail({
        to: recipient,
        subject: `Pryrox receipt — ${result.planName} (${result.invoiceNumber})`,
        html: paymentReceiptEmailHtml({
          pharmacyName: result.pharmacyName ?? "Your pharmacy",
          planName: result.planName,
          amount: result.amount,
          currency: result.currency,
          invoiceNumber: result.invoiceNumber,
          paymentMethod: result.paymentMethodLabel,
          paidAt: new Date(result.paidAt).toLocaleString("en-RW", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        }),
        text: `Payment received for ${result.planName}: ${result.amount} ${result.currency}. Invoice ${result.invoiceNumber}.`,
      });
      emailSent = true;
    } catch (e) {
      console.error("recordSubscriptionPayment: email", e);
    }
  }

  return {
    recorded: true,
    invoiceId: result.invoiceId,
    emailSent,
  };
}
