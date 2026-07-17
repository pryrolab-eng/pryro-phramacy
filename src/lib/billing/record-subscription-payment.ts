import { storeRecordSubscriptionPayment } from "@/lib/db/billing-store";
import { isSmtpConfigured, sendMail } from "@/lib/email/mailer";
import {
  paymentReceiptEmailHtml,
  paymentReceiptEmailText,
} from "@/lib/email/payment-receipt";
import { resolveEmailTemplate } from "@/lib/email/template-overrides";
import {
  emitPlatformAdminNotification,
  PLATFORM_ADMIN_EVENT,
} from "@/lib/notifications/platform-admin";

/** Idempotent: invoice + payments row + receipt email after subscription payment completes. */
export async function recordSubscriptionPayment(
  transactionId: string,
): Promise<{ recorded: boolean; invoiceId?: string; emailSent?: boolean }> {
  const result = await storeRecordSubscriptionPayment(transactionId);

  if (!result.recorded) {
    return { recorded: false };
  }

  void emitPlatformAdminNotification({
    eventType: PLATFORM_ADMIN_EVENT.subscriptionPaid,
    title: "Subscription payment received",
    message: [
      result.pharmacyName,
      result.planName ? `paid for ${result.planName}` : "completed a subscription payment",
    ]
      .filter(Boolean)
      .join(" "),
    type: "success",
    actionUrl: result.pharmacyId
      ? `/admin/tenants`
      : `/admin/billing`,
    payload: {
      pharmacyId: result.pharmacyId,
      pharmacyName: result.pharmacyName,
      planName: result.planName,
      amount: result.amount,
      currency: result.currency,
      invoiceNumber: result.invoiceNumber,
      transactionId,
    },
  });

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
      const defaultSubject = `Pryrox receipt — ${result.planName} (${result.invoiceNumber})`;
      const formattedPaidAt = new Date(result.paidAt).toLocaleString("en-RW", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      const defaultHtml = paymentReceiptEmailHtml({
        pharmacyName: result.pharmacyName ?? "Your pharmacy",
        planName: result.planName,
        amount: result.amount,
        currency: result.currency,
        invoiceNumber: result.invoiceNumber,
        paymentMethod: result.paymentMethodLabel,
        paidAt: formattedPaidAt,
      });
      const defaultText = paymentReceiptEmailText({
        pharmacyName: result.pharmacyName ?? "Your pharmacy",
        planName: result.planName,
        amount: result.amount,
        currency: result.currency,
        invoiceNumber: result.invoiceNumber,
        paymentMethod: result.paymentMethodLabel,
        paidAt: formattedPaidAt,
      });

      const template = await resolveEmailTemplate({
        templateKey: "billing.payment_receipt",
        subject: defaultSubject,
        html: defaultHtml,
        text: defaultText,
        variables: {
          pharmacyName: result.pharmacyName ?? "Your pharmacy",
          planName: result.planName,
          amount: String(result.amount),
          currency: result.currency,
          invoiceNumber: result.invoiceNumber,
          paymentMethod: result.paymentMethodLabel,
          paidAt: formattedPaidAt,
        },
      });

      await sendMail({
        to: recipient,
        subject: template.subject,
        html: template.html,
        text: template.text ?? defaultText,
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
