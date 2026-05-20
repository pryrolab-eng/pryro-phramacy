import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { createServiceClient } from "../../../../supabase/service";

export type BillingHistoryItem = {
  id: string;
  date: string;
  amount: number;
  status: string;
  planName: string;
  provider: string;
  invoiceNumber?: string;
  source: "invoice" | "transaction";
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userPharmacy } = await supabase
      .from("pharmacy_users")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!userPharmacy?.pharmacy_id) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 403 });
    }

    const pharmacyId = userPharmacy.pharmacy_id;
    const admin = createServiceClient();

    const [{ data: invoices }, { data: transactions }, { data: paymentMethod }] =
      await Promise.all([
        admin
          .from("invoices")
          .select("*")
          .eq("pharmacy_id", pharmacyId)
          .order("created_at", { ascending: false })
          .limit(20),
        admin
          .from("payment_transactions")
          .select(
            "id, amount, status, payment_details, payment_provider, payment_method, created_at, completed_at, customer_email"
          )
          .eq("pharmacy_id", pharmacyId)
          .in("status", ["completed", "processing", "pending", "failed"])
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("payment_methods")
          .select("*")
          .eq("pharmacy_id", pharmacyId)
          .eq("is_default", true)
          .maybeSingle(),
      ]);

    const invoiceHistory: BillingHistoryItem[] = (invoices ?? []).map((inv) => {
      const row = inv as {
        id: string;
        created_at: string;
        amount: unknown;
        status: string;
        plan_name: string;
        invoice_number: string;
      };
      return {
        id: row.id,
        date: row.created_at.split("T")[0],
        amount: Number(row.amount ?? 0),
        status: row.status === "paid" ? "Paid" : row.status,
        planName: row.plan_name,
        provider: "invoice",
        invoiceNumber: row.invoice_number,
        source: "invoice" as const,
      };
    });

    const txHistory: BillingHistoryItem[] = (transactions ?? [])
      .filter((t) => {
        const row = t as { id: string };
        return !invoiceHistory.some(
          (i) => i.id === row.id || i.invoiceNumber?.includes(row.id.slice(0, 8))
        );
      })
      .map((tx) => {
        const row = tx as {
          id: string;
          amount: unknown;
          status: string;
          payment_details: string | null;
          payment_provider: string | null;
          payment_method: string | null;
          created_at: string;
          completed_at: string | null;
        };
        const details = row.payment_details ?? "Subscription";
        const planMatch = details.match(/^(.+?)\s+subscription/i);
        return {
          id: row.id,
          date: (row.completed_at || row.created_at).split("T")[0],
          amount: Number(row.amount ?? 0),
          status:
            row.status === "completed"
              ? "Paid"
              : row.status.charAt(0).toUpperCase() + row.status.slice(1),
          planName: planMatch?.[1]?.trim() || details,
          provider: row.payment_provider || row.payment_method || "payment",
          source: "transaction" as const,
        };
      });

    const history = [...invoiceHistory, ...txHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const nextPending = (invoices ?? []).find(
      (inv) => (inv as { status?: string }).status === "pending"
    ) as { due_date?: string; amount?: unknown } | undefined;

    const { data: activeSub } = await admin
      .from("subscriptions")
      .select("expires_at, payment_method")
      .eq("pharmacy_id", pharmacyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastPaid = history.find((h) => h.status === "Paid");

    return NextResponse.json({
      nextBilling:
        nextPending?.due_date ||
        (activeSub?.expires_at
          ? String(activeSub.expires_at).split("T")[0]
          : null),
      amount: nextPending
        ? Number(nextPending.amount ?? 0)
        : lastPaid?.amount ?? 0,
      paymentMethod:
        (paymentMethod as { method_type?: string } | null)?.method_type ||
        (activeSub?.payment_method === "polar"
          ? "Card (Polar)"
          : activeSub?.payment_method
            ? String(activeSub.payment_method)
            : "Not set"),
      invoices: history,
      history,
      emailReceiptsEnabled: Boolean(
        process.env.SMTP_HOST?.trim() &&
          process.env.SMTP_USER?.trim() &&
          process.env.SMTP_PASS?.trim()
      ),
    });
  } catch (error) {
    console.error("Billing fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch billing" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const receiptNumber = `INV-${Date.now()}`;

    const { data: invoice, error } = await supabase.from("sales").insert({
      pharmacy_id: body.pharmacy_id || "userPharmacy.pharmacy_id",
      customer_name: body.customer,
      total_amount: body.amount,
      receipt_number: receiptNumber,
      status: "pending",
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
