import type { SupabaseClient } from "@supabase/supabase-js";
import { isSmtpConfigured, sendMail } from "@/lib/email/mailer";
import { paymentReceiptEmailHtml } from "@/lib/email/payment-receipt";

function invoiceNumberFromDate(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${ymd}-${suffix}`;
}

function planNameFromDetails(details: string | null | undefined): string {
  if (!details) return "Subscription";
  const match = details.match(/^(.+?)\s+subscription/i);
  return match?.[1]?.trim() || details;
}

function paymentMethodLabel(
  provider: string | null | undefined,
  method: string | null | undefined
): string {
  if (provider === "polar" || method === "polar") return "Card (Polar)";
  if (method === "momo") return "Mobile Money (KPay)";
  if (method === "cc") return "Card (KPay)";
  return method || provider || "Payment";
}

/** Idempotent: invoice + payments row + receipt email after subscription payment completes. */
export async function recordSubscriptionPayment(
  admin: SupabaseClient,
  transactionId: string
): Promise<{ recorded: boolean; invoiceId?: string; emailSent?: boolean }> {
  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("payment_reference", transactionId)
    .maybeSingle();

  if (existingPayment) {
    return { recorded: false };
  }

  const { data: tx, error: txErr } = await admin
    .from("payment_transactions")
    .select(
      "id, pharmacy_id, subscription_id, amount, currency, status, payment_method, payment_provider, customer_email, customer_name, payment_details, completed_at, created_at"
    )
    .eq("id", transactionId)
    .maybeSingle();

  if (txErr || !tx) {
    console.error("recordSubscriptionPayment: transaction", txErr);
    return { recorded: false };
  }

  if (tx.status !== "completed") {
    return { recorded: false };
  }

  if (!tx.pharmacy_id) {
    return { recorded: false };
  }

  const planName = planNameFromDetails(tx.payment_details);
  const paidAt = tx.completed_at || tx.created_at || new Date().toISOString();
  const paidDate = paidAt.split("T")[0];
  const invoiceNumber = invoiceNumberFromDate();
  const amount = Number(tx.amount ?? 0);
  const currency = String(tx.currency ?? "RWF");

  const { data: invoice, error: invErr } = await admin
    .from("invoices")
    .insert({
      pharmacy_id: tx.pharmacy_id,
      invoice_number: invoiceNumber,
      amount,
      status: "paid",
      due_date: paidDate,
      paid_date: paidDate,
      plan_name: planName,
    })
    .select("id, invoice_number")
    .single();

  if (invErr) {
    console.error("recordSubscriptionPayment: invoice", invErr);
    return { recorded: false };
  }

  const methodLabel = paymentMethodLabel(
    tx.payment_provider as string | null,
    tx.payment_method as string | null
  );

  const { error: payErr } = await admin.from("payments").insert({
    pharmacy_id: tx.pharmacy_id,
    invoice_id: invoice.id,
    amount,
    payment_method: methodLabel,
    payment_reference: transactionId,
    status: "completed",
  });

  if (payErr) {
    console.error("recordSubscriptionPayment: payments", payErr);
  }

  const { data: pharmacy } = await admin
    .from("pharmacies")
    .select("name, email")
    .eq("id", tx.pharmacy_id)
    .maybeSingle();

  const recipient =
    (tx.customer_email as string | null)?.trim() ||
    (pharmacy?.email as string | null)?.trim() ||
    "";

  let emailSent = false;
  if (recipient && isSmtpConfigured()) {
    try {
      await sendMail({
        to: recipient,
        subject: `Pryrox receipt — ${planName} (${invoice.invoice_number})`,
        html: paymentReceiptEmailHtml({
          pharmacyName: (pharmacy?.name as string) || "Your pharmacy",
          planName,
          amount,
          currency,
          invoiceNumber: invoice.invoice_number,
          paymentMethod: methodLabel,
          paidAt: new Date(paidAt).toLocaleString("en-RW", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        }),
        text: `Payment received for ${planName}: ${amount} ${currency}. Invoice ${invoice.invoice_number}.`,
      });
      emailSent = true;
    } catch (e) {
      console.error("recordSubscriptionPayment: email", e);
    }
  }

  return { recorded: true, invoiceId: invoice.id, emailSent };
}
