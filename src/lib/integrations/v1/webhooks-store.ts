import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export const INTEGRATION_WEBHOOK_EVENTS = [
  "sale.completed",
  "inventory.low_stock",
  "inventory.expiring_soon",
] as const;

export type IntegrationWebhookEvent =
  (typeof INTEGRATION_WEBHOOK_EVENTS)[number];

export function normalizeWebhookEvents(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(INTEGRATION_WEBHOOK_EVENTS);
  const unique = Array.from(
    new Set(
      input
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  if (unique.includes("*")) return [...INTEGRATION_WEBHOOK_EVENTS];
  return unique.filter((event) => allowed.has(event));
}

export function webhookMatchesEvent(
  events: string[],
  eventType: string,
): boolean {
  if (events.includes("*")) return true;
  return events.includes(eventType);
}

export async function listIntegrationWebhooksForKey(apiKeyId: string) {
  return prisma.integration_webhooks.findMany({
    where: { api_key_id: apiKeyId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      url: true,
      events: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });
}

export async function createIntegrationWebhook(input: {
  apiKeyId: string;
  url: string;
  secret?: string | null;
  events: string[];
}) {
  return prisma.integration_webhooks.create({
    data: {
      api_key_id: input.apiKeyId,
      url: input.url,
      secret: input.secret ?? null,
      events: input.events,
      is_active: true,
    },
    select: {
      id: true,
      url: true,
      events: true,
      is_active: true,
      created_at: true,
    },
  });
}

export async function findIntegrationWebhookForKey(
  webhookId: string,
  apiKeyId: string,
) {
  return prisma.integration_webhooks.findFirst({
    where: { id: webhookId, api_key_id: apiKeyId },
    select: { id: true, url: true, events: true, is_active: true },
  });
}

export async function deactivateIntegrationWebhook(
  webhookId: string,
  apiKeyId: string,
) {
  const row = await prisma.integration_webhooks.updateMany({
    where: { id: webhookId, api_key_id: apiKeyId },
    data: { is_active: false, updated_at: new Date() },
  });
  return row.count > 0;
}

export async function listActiveWebhooksForEvent(eventType: string) {
  const rows = await prisma.integration_webhooks.findMany({
    where: { is_active: true },
    select: {
      id: true,
      url: true,
      secret: true,
      events: true,
      api_key_id: true,
    },
  });
  return rows.filter((row) => webhookMatchesEvent(row.events, eventType));
}

export async function enqueueIntegrationWebhookDeliveries(input: {
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const webhooks = await listActiveWebhooksForEvent(input.eventType);
  if (webhooks.length === 0) return [];

  const deliveries = await Promise.all(
    webhooks.map((webhook) =>
      prisma.integration_webhook_deliveries.create({
        data: {
          webhook_id: webhook.id,
          event_type: input.eventType,
          payload: input.payload as Prisma.InputJsonValue,
          status: "pending",
        },
        select: { id: true, webhook_id: true },
      }),
    ),
  );

  return deliveries;
}

export async function listPendingWebhookDeliveries(limit = 50) {
  return prisma.integration_webhook_deliveries.findMany({
    where: { status: "pending", attempts: { lt: 5 } },
    orderBy: { created_at: "asc" },
    take: limit,
    include: {
      integration_webhooks: {
        select: { url: true, secret: true, is_active: true },
      },
    },
  });
}

export async function markWebhookDeliveryResult(
  deliveryId: string,
  result: {
    status: "delivered" | "pending" | "failed";
    responseStatus?: number;
    lastError?: string;
    attempts: number;
  },
) {
  await prisma.integration_webhook_deliveries.update({
    where: { id: deliveryId },
    data: {
      status: result.status,
      attempts: result.attempts,
      response_status: result.responseStatus ?? null,
      last_error: result.lastError ?? null,
      delivered_at: result.status === "delivered" ? new Date() : null,
    },
  });
}
