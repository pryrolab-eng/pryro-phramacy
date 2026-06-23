import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePlatformApiKey } from "@/lib/auth/require-platform-api-key";
import {
  INTEGRATION_V1_DISCOVERY,
  INTEGRATION_V1_PERMISSIONS,
  parseIntegrationDateRange,
  parseIntegrationLimit,
  parseOptionalBranchId,
  parseRequiredPharmacyId,
} from "@/lib/integrations/v1/constants";
import {
  getIntegrationPharmacyDetail,
  listIntegrationInventory,
  listIntegrationPharmacies,
  listIntegrationSales,
  pharmacyExists,
} from "@/lib/integrations/v1/store";
import {
  createIntegrationWebhook,
  deactivateIntegrationWebhook,
  listIntegrationWebhooksForKey,
  normalizeWebhookEvents,
} from "@/lib/integrations/v1/webhooks-store";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformApiKey(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    ...INTEGRATION_V1_DISCOVERY,
    key: { name: auth.key.name, permissions: auth.key.permissions },
  });
}

export async function GET_pharmaciesList(request: NextRequest) {
  const auth = await requirePlatformApiKey(
    request,
    INTEGRATION_V1_PERMISSIONS.pharmaciesRead,
  );
  if (!auth.ok) return auth.response;

  const includeInactive =
    new URL(request.url).searchParams.get("includeInactive") === "true";
  const pharmacies = await listIntegrationPharmacies({
    activeOnly: !includeInactive,
  });

  return NextResponse.json({ pharmacies, count: pharmacies.length });
}

export async function GET_pharmacyById(
  request: NextRequest,
  pharmacyId: string,
) {
  const auth = await requirePlatformApiKey(
    request,
    INTEGRATION_V1_PERMISSIONS.pharmaciesRead,
  );
  if (!auth.ok) return auth.response;

  const pharmacy = await getIntegrationPharmacyDetail(pharmacyId);
  if (!pharmacy) {
    return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
  }

  return NextResponse.json({ pharmacy });
}

export async function GET_inventory(request: NextRequest) {
  const auth = await requirePlatformApiKey(
    request,
    INTEGRATION_V1_PERMISSIONS.inventoryRead,
  );
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const pharmacyId = parseRequiredPharmacyId(params);
  if (!pharmacyId) {
    return NextResponse.json(
      { error: "pharmacyId query parameter is required" },
      { status: 400 },
    );
  }

  if (!(await pharmacyExists(pharmacyId))) {
    return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
  }

  const branchId = parseOptionalBranchId(params);
  const inventory = await listIntegrationInventory(pharmacyId, branchId);

  return NextResponse.json({
    pharmacyId,
    branchId: branchId ?? null,
    inventory,
    count: inventory.length,
  });
}

export async function GET_sales(request: NextRequest) {
  const auth = await requirePlatformApiKey(
    request,
    INTEGRATION_V1_PERMISSIONS.salesRead,
  );
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const pharmacyId = parseRequiredPharmacyId(params);
  if (!pharmacyId) {
    return NextResponse.json(
      { error: "pharmacyId query parameter is required" },
      { status: 400 },
    );
  }

  if (!(await pharmacyExists(pharmacyId))) {
    return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
  }

  const { from, to } = parseIntegrationDateRange(params);
  const limit = parseIntegrationLimit(params);
  const sales = await listIntegrationSales({ pharmacyId, from, to, limit });

  return NextResponse.json({
    pharmacyId,
    from: from?.toISOString() ?? null,
    to: to?.toISOString() ?? null,
    sales,
    count: sales.length,
  });
}

export async function GET_webhooksList(request: NextRequest) {
  const auth = await requirePlatformApiKey(
    request,
    INTEGRATION_V1_PERMISSIONS.webhooksManage,
  );
  if (!auth.ok) return auth.response;

  const webhooks = await listIntegrationWebhooksForKey(auth.key.id);
  return NextResponse.json({ webhooks, count: webhooks.length });
}

export async function POST_webhooksCreate(request: NextRequest) {
  const auth = await requirePlatformApiKey(
    request,
    INTEGRATION_V1_PERMISSIONS.webhooksManage,
  );
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "A valid http(s) webhook url is required" },
      { status: 400 },
    );
  }

  const events = normalizeWebhookEvents(body.events);
  if (events.length === 0) {
    return NextResponse.json(
      { error: "At least one event subscription is required" },
      { status: 400 },
    );
  }

  const webhook = await createIntegrationWebhook({
    apiKeyId: auth.key.id,
    url,
    secret: typeof body.secret === "string" ? body.secret : null,
    events,
  });

  return NextResponse.json({ webhook }, { status: 201 });
}

export async function DELETE_webhookById(
  request: NextRequest,
  webhookId: string,
) {
  const auth = await requirePlatformApiKey(
    request,
    INTEGRATION_V1_PERMISSIONS.webhooksManage,
  );
  if (!auth.ok) return auth.response;

  const removed = await deactivateIntegrationWebhook(webhookId, auth.key.id);
  if (!removed) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
