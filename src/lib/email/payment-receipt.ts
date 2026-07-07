import {
  emailDetailTable,
  emailParagraph,
  escapeHtml,
  pryroxEmailLayout,
} from "./layout";

export function paymentReceiptEmailHtml(params: {
  pharmacyName: string;
  planName: string;
  amount: number | string;
  currency: string;
  invoiceNumber: string;
  paymentMethod: string;
  paidAt: string;
}): string {
  const amountLabel =
    typeof params.amount === "number"
      ? `${params.amount.toLocaleString()} ${params.currency}`
      : `${params.amount} ${params.currency}`;

  return pryroxEmailLayout({
    title: "Payment received",
    preheader: `Receipt for ${params.planName} — ${amountLabel}`,
    footerNote:
      "This is an automated receipt for your Pryrox subscription payment.",
    bodyHtml: [
      emailParagraph(
        `Thank you — your subscription payment for <strong style="color:#0f172a;">${escapeHtml(params.pharmacyName)}</strong> was successful.`,
      ),
      emailDetailTable([
        { label: "Plan", value: params.planName, emphasize: true },
        { label: "Amount", value: amountLabel, emphasize: true },
        { label: "Payment method", value: params.paymentMethod },
        { label: "Invoice number", value: params.invoiceNumber },
        { label: "Date paid", value: params.paidAt },
      ]),
      emailParagraph(
        'You can view billing history anytime in <strong style="color:#0f172a;">Settings → Billing</strong> inside Pryrox.',
      ),
    ].join(""),
  });
}

export function paymentReceiptEmailText(params: {
  pharmacyName: string;
  planName: string;
  amount: number | string;
  currency: string;
  invoiceNumber: string;
  paymentMethod: string;
  paidAt: string;
}): string {
  const amountLabel =
    typeof params.amount === "number"
      ? `${params.amount.toLocaleString()} ${params.currency}`
      : `${params.amount} ${params.currency}`;
  return [
    "Payment received",
    "",
    `Pharmacy: ${params.pharmacyName}`,
    `Plan: ${params.planName}`,
    `Amount: ${amountLabel}`,
    `Payment method: ${params.paymentMethod}`,
    `Invoice: ${params.invoiceNumber}`,
    `Date: ${params.paidAt}`,
    "",
    "View billing history in Settings → Billing.",
    "",
    "— Pryrox",
  ].join("\n");
}
