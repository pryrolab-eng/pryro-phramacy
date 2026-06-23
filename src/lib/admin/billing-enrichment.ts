import { prisma } from "@/lib/db/prisma";
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
  options?: { limit?: number },
): Promise<AdminBillingPayload> {
  const limit = options?.limit ?? 300;

  const transactionRows = await prisma.payment_transactions.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      pharmacy_id: true,
      amount: true,
      currency: true,
      status: true,
      payment_provider: true,
      payment_method: true,
      customer_name: true,
      customer_email: true,
      completed_at: true,
      created_at: true,
      pharmacies: { select: { id: true, name: true, email: true } },
    },
  });

  const payments: AdminBillingPaymentRow[] = transactionRows.map((row) => {
    const normalized = normalizeStoredPaymentCurrency(
      Number(row.amount ?? 0),
      row.currency,
      row.payment_provider ?? row.payment_method ?? null,
    );

    return {
      id: row.id,
      pharmacy_id: row.pharmacy_id ?? "",
      pharmacy_name: row.pharmacies?.name ?? "—",
      pharmacy_email: row.pharmacies?.email ?? null,
      amount: normalized.amount,
      currency: normalized.currency,
      status: row.status ?? "pending",
      payment_provider: row.payment_provider ?? row.payment_method ?? null,
      customer_email: row.customer_email ?? null,
      customer_name: row.customer_name ?? null,
      catalog_plan_name: null,
      created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
      completed_at: row.completed_at?.toISOString() ?? null,
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

  const pharmacyRows = await prisma.pharmacies.findMany({
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true, email: true, status: true },
  });

  const pharmacyIds = pharmacyRows.map((p) => p.id);

  const subRows = pharmacyIds.length
    ? await prisma.subscriptions.findMany({
        where: { pharmacy_id: { in: pharmacyIds } },
        select: {
          id: true,
          pharmacy_id: true,
          status: true,
          is_active: true,
          expires_at: true,
          subscription_type: true,
          payment_method: true,
          pending_change_status: true,
          plan_id: true,
          plan: true,
          subscription_plans_subscriptions_plan_idTosubscription_plans: {
            select: { name: true, plan_type: true },
          },
        },
      })
    : [];

  type SubRow = (typeof subRows)[number];

  const subsByPharmacy = new Map<string, SubRow[]>();
  for (const s of subRows) {
    if (!s.pharmacy_id) continue;
    const list = subsByPharmacy.get(s.pharmacy_id) ?? [];
    list.push(s);
    subsByPharmacy.set(s.pharmacy_id, list);
  }

  const pharmacies: AdminBillingPharmacyRow[] = pharmacyRows.map((ph) => {
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
      const embedded =
        m.subscription_plans_subscriptions_plan_idTosubscription_plans;
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
        expires_at = m.expires_at?.toISOString() ?? null;
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

  for (const row of subRows) {
    if (!row.pharmacy_id) continue;
    const lifecycle = normalizeLifecycleStatus(row.status ?? "", {
      is_active: row.is_active,
      payment_method: row.payment_method,
      pending_change_status: row.pending_change_status,
    });
    const embedded =
      row.subscription_plans_subscriptions_plan_idTosubscription_plans;
    if (row.subscription_type === "main" && lifecycle === "pending_payment") {
      const ph = pharmacies.find((x) => x.pharmacy_id === row.pharmacy_id);
      pharmaciesWithPendingMain.add(row.pharmacy_id);
      reconciliation.push({
        id: `pending-${row.id ?? row.pharmacy_id}`,
        kind: "pending_main",
        pharmacy_id: row.pharmacy_id,
        pharmacy_name: ph?.pharmacy_name ?? null,
        detail: `Awaiting payment for ${embedded?.name ?? row.plan ?? "plan"}`,
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
    const isPendingTx = p.status === "pending" || p.status === "processing";
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
