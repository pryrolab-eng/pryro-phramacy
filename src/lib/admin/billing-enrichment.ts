import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeLifecycleStatus } from "@/lib/subscription/lifecycle/status";
import { isMainTierCatalogRow } from "@/lib/subscription/normalize-plan";
import { normalizeStoredPaymentCurrency } from "@/lib/polar/payment-record";
import { getPlatformCurrency, normalizeCurrency } from "@/lib/platform-currency";

export type AdminBillingPaymentRow = {
  id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  pharmacy_email: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_provider: string | null;
  customer_email: string | null;
  customer_name: string | null;
  catalog_plan_name: string | null;
  created_at: string;
  completed_at: string | null;
};

export type AdminBillingPharmacyRow = {
  pharmacy_id: string;
  pharmacy_name: string;
  pharmacy_email: string | null;
  access_status: string;
  main_plan_name: string | null;
  main_billing_status: string | null;
  pending_plan_name: string | null;
  branch_addons_active: number;
  expires_at: string | null;
};

export type AdminBillingSummary = {
  completed_count: number;
  pending_count: number;
  failed_count: number;
  volume_by_currency: Record<string, number>;
  platform_currency: string;
};

function formatMoneyShort(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${normalizeCurrency(currency)}`;
}

export type AdminBillingReconciliationRow = {
  id: string;
  kind: "orphan_payment" | "pending_main" | "missing_plan_id";
  pharmacy_id: string | null;
  pharmacy_name: string | null;
  detail: string;
  payment_transaction_id?: string | null;
  subscription_id?: string | null;
  can_cancel: boolean;
};

export type AdminBillingPayload = {
  summary: AdminBillingSummary;
  payments: AdminBillingPaymentRow[];
  pharmacies: AdminBillingPharmacyRow[];
  reconciliation: AdminBillingReconciliationRow[];
};

function formatLifecycleLabel(status: string): string {
  const s = status.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function buildAdminBillingPayload(
  db: SupabaseClient,
  options?: { limit?: number },
): Promise<AdminBillingPayload> {
  const limit = options?.limit ?? 300;

  const { data: transactions, error: txError } = await db
    .from("payment_transactions")
    .select(
      `
      id,
      pharmacy_id,
      amount,
      currency,
      status,
      payment_provider,
      payment_method,
      customer_name,
      customer_email,
      completed_at,
      created_at,
      pharmacies ( id, name, email )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (txError) throw txError;

  const payments: AdminBillingPaymentRow[] = (transactions ?? []).map((tx) => {
    const row = tx as {
      id: string;
      pharmacy_id: string;
      amount?: unknown;
      currency?: string | null;
      status: string;
      payment_provider?: string | null;
      payment_method?: string | null;
      customer_name?: string | null;
      customer_email?: string | null;
      completed_at?: string | null;
      created_at: string;
      pharmacies?:
        | { name?: string; email?: string | null }
        | { name?: string; email?: string | null }[]
        | null;
    };
    const ph = Array.isArray(row.pharmacies)
      ? row.pharmacies[0]
      : row.pharmacies;

    const normalized = normalizeStoredPaymentCurrency(
      Number(row.amount ?? 0),
      row.currency,
      row.payment_provider ?? row.payment_method ?? null,
    );

    return {
      id: row.id,
      pharmacy_id: row.pharmacy_id,
      pharmacy_name: ph?.name ?? "—",
      pharmacy_email: ph?.email ?? null,
      amount: normalized.amount,
      currency: normalized.currency,
      status: row.status,
      payment_provider: row.payment_provider ?? row.payment_method ?? null,
      customer_email: row.customer_email ?? null,
      customer_name: row.customer_name ?? null,
      catalog_plan_name: null,
      created_at: row.created_at,
      completed_at: row.completed_at ?? null,
    };
  });

  const volume_by_currency: Record<string, number> = {};
  let completed_count = 0;
  let pending_count = 0;
  let failed_count = 0;

  const platformCurrency = getPlatformCurrency();

  for (const p of payments) {
    if (p.status === "completed") {
      completed_count++;
      const cur = normalizeCurrency(p.currency);
      volume_by_currency[cur] = (volume_by_currency[cur] ?? 0) + p.amount;
    } else if (p.status === "failed") {
      failed_count++;
    } else if (p.status === "pending" || p.status === "processing") {
      pending_count++;
    }
  }

  const { data: pharmacyRows, error: phError } = await db
    .from("pharmacies")
    .select("id, name, email, status")
    .order("name", { ascending: true })
    .limit(limit);

  if (phError) throw phError;

  const pharmacyIds = (pharmacyRows ?? []).map((p) => (p as { id: string }).id);

  const { data: subRows, error: subError } = pharmacyIds.length
    ? await db
        .from("subscriptions")
        .select(
          `
          id,
          pharmacy_id,
          status,
          is_active,
          expires_at,
          subscription_type,
          payment_method,
          pending_change_status,
          plan_id,
          plan,
          subscription_plans!plan_id ( name, plan_type )
        `,
        )
        .in("pharmacy_id", pharmacyIds)
    : { data: [], error: null };

  if (subError) throw subError;

  type SubRow = {
    pharmacy_id: string;
    status?: string;
    is_active?: boolean;
    expires_at?: string | null;
    subscription_type?: string;
    payment_method?: string | null;
    pending_change_status?: string | null;
    plan?: string | null;
    subscription_plans?: { name?: string; plan_type?: string } | null;
  };

  const subsByPharmacy = new Map<string, SubRow[]>();
  for (const s of (subRows ?? []) as SubRow[]) {
    const list = subsByPharmacy.get(s.pharmacy_id) ?? [];
    list.push(s);
    subsByPharmacy.set(s.pharmacy_id, list);
  }

  const pharmacies: AdminBillingPharmacyRow[] = (pharmacyRows ?? []).map((p) => {
    const ph = p as {
      id: string;
      name?: string;
      email?: string | null;
      status?: string;
    };
    const subs = subsByPharmacy.get(ph.id) ?? [];
    const mainSubs = subs.filter((s) => s.subscription_type === "main");
    const addons = subs.filter(
      (s) =>
        s.subscription_type === "branch_addon" &&
        normalizeLifecycleStatus(s.status ?? "", {
          is_active: s.is_active,
          payment_method: s.payment_method,
          pending_change_status: s.pending_change_status,
        }) === "active",
    );

    let main_plan_name: string | null = null;
    let main_billing_status: string | null = null;
    let pending_plan_name: string | null = null;
    let expires_at: string | null = null;

    for (const m of mainSubs) {
      const embedded = m.subscription_plans;
      if (embedded && !isMainTierCatalogRow(embedded)) continue;
      const lifecycle = normalizeLifecycleStatus(m.status ?? "", {
        is_active: m.is_active,
        payment_method: m.payment_method,
        pending_change_status: m.pending_change_status,
      });
      const planLabel =
        embedded?.name ?? (String(m.plan ?? "").trim() || null);

      if (lifecycle === "pending_payment" && !pending_plan_name) {
        pending_plan_name = planLabel;
      }
      if (lifecycle === "active" && !main_plan_name) {
        main_plan_name = planLabel;
        main_billing_status = formatLifecycleLabel(lifecycle);
        expires_at = m.expires_at ?? null;
      }
    }

    return {
      pharmacy_id: ph.id,
      pharmacy_name: ph.name ?? "—",
      pharmacy_email: ph.email ?? null,
      access_status: String(ph.status ?? "active"),
      main_plan_name,
      main_billing_status,
      pending_plan_name,
      branch_addons_active: addons.length,
      expires_at,
    };
  });

  const reconciliation: AdminBillingReconciliationRow[] = [];
  const pharmaciesWithPendingMain = new Set<string>();

  for (const row of (subRows ?? []) as Array<SubRow & { id?: string; plan_id?: string | null }>) {
    const lifecycle = normalizeLifecycleStatus(row.status ?? "", {
      is_active: row.is_active,
      payment_method: row.payment_method,
      pending_change_status: row.pending_change_status,
    });
    if (
      row.subscription_type === "main" &&
      lifecycle === "pending_payment"
    ) {
      const ph = pharmacies.find((x) => x.pharmacy_id === row.pharmacy_id);
      pharmaciesWithPendingMain.add(row.pharmacy_id);
      reconciliation.push({
        id: `pending-${row.id ?? row.pharmacy_id}`,
        kind: "pending_main",
        pharmacy_id: row.pharmacy_id,
        pharmacy_name: ph?.pharmacy_name ?? null,
        detail: `Awaiting payment for ${row.subscription_plans?.name ?? row.plan ?? "plan"}`,
        payment_transaction_id: null,
        subscription_id: row.id ?? null,
        can_cancel: true,
      });
    }
    if (!row.plan_id && row.subscription_type === "main") {
      const ph = pharmacies.find((x) => x.pharmacy_id === row.pharmacy_id);
      reconciliation.push({
        id: `noplanid-${row.pharmacy_id}`,
        kind: "missing_plan_id",
        pharmacy_id: row.pharmacy_id,
        pharmacy_name: ph?.pharmacy_name ?? null,
        detail: `Main subscription uses legacy plan string "${row.plan ?? ""}"`,
        payment_transaction_id: null,
        subscription_id: row.id ?? null,
        can_cancel: false,
      });
    }
  }

  for (const p of payments) {
    const isPendingTx =
      p.status === "pending" || p.status === "processing";
    if (!p.pharmacy_id || p.pharmacy_name === "—") {
      reconciliation.push({
        id: `tx-${p.id}`,
        kind: "orphan_payment",
        pharmacy_id: p.pharmacy_id || null,
        pharmacy_name: p.pharmacy_name,
        detail: `Payment ${p.status} without pharmacy link`,
        payment_transaction_id: p.id,
        subscription_id: null,
        can_cancel: isPendingTx,
      });
    } else if (isPendingTx && !pharmaciesWithPendingMain.has(p.pharmacy_id)) {
      reconciliation.push({
        id: `tx-pending-${p.id}`,
        kind: "orphan_payment",
        pharmacy_id: p.pharmacy_id,
        pharmacy_name: p.pharmacy_name,
        detail: `Pending checkout (${formatMoneyShort(p.amount, p.currency)})`,
        payment_transaction_id: p.id,
        subscription_id: null,
        can_cancel: true,
      });
    }
  }

  const dedupedRecon = Array.from(
    new Map(reconciliation.map((r) => [r.id, r])).values(),
  ).slice(0, 50);

  return {
    summary: {
      completed_count,
      pending_count,
      failed_count,
      volume_by_currency,
      platform_currency: platformCurrency,
    },
    payments,
    pharmacies,
    reconciliation: dedupedRecon,
  };
}
