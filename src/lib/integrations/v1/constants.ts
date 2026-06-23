/** Scopes assignable on platform integration API keys (`api_keys.permissions`). */
export const INTEGRATION_V1_PERMISSIONS = {
  pharmaciesRead: "pharmacies.read",
  inventoryRead: "inventory.read",
  salesRead: "sales.read",
  webhooksManage: "webhooks.manage",
  all: "*",
} as const;

export type IntegrationV1Permission =
  (typeof INTEGRATION_V1_PERMISSIONS)[keyof typeof INTEGRATION_V1_PERMISSIONS];

export const INTEGRATION_V1_DISCOVERY = {
  version: "v1",
  auth: {
    headers: ["X-Pryrox-Api-Key", "Authorization: Bearer <key>"],
    issuedBy: "Pryrox platform admin (Admin → Settings → Integrations)",
    note: "Platform keys for external developers — not per-pharmacy tenant credentials.",
  },
  endpoints: [
    {
      method: "GET",
      path: "/api/integrations/v1/health",
      permission: null,
      description: "Liveness check; confirms key is valid",
    },
    {
      method: "GET",
      path: "/api/integrations/v1",
      permission: null,
      description: "This discovery document",
    },
    {
      method: "GET",
      path: "/api/integrations/v1/pharmacies",
      permission: INTEGRATION_V1_PERMISSIONS.pharmaciesRead,
      description: "List pharmacies (active by default)",
    },
    {
      method: "GET",
      path: "/api/integrations/v1/pharmacies/{id}",
      permission: INTEGRATION_V1_PERMISSIONS.pharmaciesRead,
      description: "Pharmacy profile + branch list",
    },
    {
      method: "GET",
      path: "/api/integrations/v1/inventory",
      permission: INTEGRATION_V1_PERMISSIONS.inventoryRead,
      query: "pharmacyId (required), branchId (optional)",
      description: "Branch-scoped stock rows",
    },
    {
      method: "GET",
      path: "/api/integrations/v1/sales",
      permission: INTEGRATION_V1_PERMISSIONS.salesRead,
      query: "pharmacyId (required), from, to, limit",
      description: "Completed sales with line-item counts",
    },
    {
      method: "GET",
      path: "/api/integrations/v1/webhooks",
      permission: INTEGRATION_V1_PERMISSIONS.webhooksManage,
      description: "List webhooks registered by the current API key",
    },
    {
      method: "POST",
      path: "/api/integrations/v1/webhooks",
      permission: INTEGRATION_V1_PERMISSIONS.webhooksManage,
      description: "Register an outbound webhook URL and event subscriptions",
    },
    {
      method: "DELETE",
      path: "/api/integrations/v1/webhooks/{id}",
      permission: INTEGRATION_V1_PERMISSIONS.webhooksManage,
      description: "Deactivate a webhook owned by the current API key",
    },
  ],
  webhooks: {
    status: "available",
    direction: "outbound",
    description:
      "Pryrox POSTs events to partner URLs registered via /api/integrations/v1/webhooks.",
    events: [
      "sale.completed",
      "inventory.low_stock",
      "inventory.expiring_soon",
    ],
  },
} as const;

export function parseRequiredPharmacyId(
  searchParams: URLSearchParams,
): string | null {
  const id = searchParams.get("pharmacyId")?.trim();
  return id || null;
}

export function parseOptionalBranchId(
  searchParams: URLSearchParams,
): string | undefined {
  const id = searchParams.get("branchId")?.trim();
  return id && id !== "all" ? id : undefined;
}

export function parseIntegrationDateRange(searchParams: URLSearchParams): {
  from?: Date;
  to?: Date;
} {
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const from = fromRaw ? new Date(fromRaw) : undefined;
  const to = toRaw ? new Date(toRaw) : undefined;
  if (to) to.setHours(23, 59, 59, 999);
  return {
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
  };
}

export function parseIntegrationLimit(
  searchParams: URLSearchParams,
  defaultLimit = 50,
  max = 200,
): number {
  const raw = Number(searchParams.get("limit") ?? defaultLimit);
  if (!Number.isFinite(raw)) return defaultLimit;
  return Math.min(Math.max(Math.floor(raw), 1), max);
}

/** Scopes admins can assign when creating platform integration keys. */
export const INTEGRATION_V1_ASSIGNABLE_PERMISSIONS = [
  INTEGRATION_V1_PERMISSIONS.pharmaciesRead,
  INTEGRATION_V1_PERMISSIONS.inventoryRead,
  INTEGRATION_V1_PERMISSIONS.salesRead,
  INTEGRATION_V1_PERMISSIONS.webhooksManage,
  INTEGRATION_V1_PERMISSIONS.all,
] as const;

const ASSIGNABLE_SET = new Set<string>(INTEGRATION_V1_ASSIGNABLE_PERMISSIONS);

/** Empty array = full access (same as legacy keys). */
export function normalizeIntegrationKeyPermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const trimmed = input
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(trimmed));
  if (unique.includes(INTEGRATION_V1_PERMISSIONS.all)) return ["*"];
  return unique.filter((scope) => ASSIGNABLE_SET.has(scope));
}
