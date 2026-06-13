import { createHmac } from "crypto";
import {
  enqueueIntegrationWebhookDeliveries,
  listPendingWebhookDeliveries,
  markWebhookDeliveryResult,
} from "@/lib/integrations/v1/webhooks-store";

function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function dispatchIntegrationWebhookEvent(input: {
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const deliveries = await enqueueIntegrationWebhookDeliveries(input);
  if (deliveries.length === 0) return;
  await deliverPendingIntegrationWebhooks({ limit: deliveries.length });
}

export async function deliverPendingIntegrationWebhooks(options?: {
  limit?: number;
}): Promise<{ processed: number; delivered: number; failed: number }> {
  const rows = await listPendingWebhookDeliveries(options?.limit ?? 50);
  let delivered = 0;
  let failed = 0;

  for (const row of rows) {
    const webhook = row.integration_webhooks;
    if (!webhook?.is_active) {
      await markWebhookDeliveryResult(row.id, {
        status: "failed",
        attempts: row.attempts + 1,
        lastError: "Webhook inactive",
      });
      failed += 1;
      continue;
    }

    const body = JSON.stringify({
      id: row.id,
      type: row.event_type,
      createdAt: row.created_at.toISOString(),
      data: row.payload,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Pryrox-Event": row.event_type,
    };
    if (webhook.secret) {
      headers["X-Pryrox-Signature"] = signPayload(webhook.secret, body);
    }

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        await markWebhookDeliveryResult(row.id, {
          status: "delivered",
          attempts: row.attempts + 1,
          responseStatus: response.status,
        });
        delivered += 1;
      } else {
        const attempts = row.attempts + 1;
        await markWebhookDeliveryResult(row.id, {
          status: attempts >= 5 ? "failed" : "pending",
          attempts,
          responseStatus: response.status,
          lastError: `HTTP ${response.status}`,
        });
        failed += 1;
      }
    } catch (error) {
      const attempts = row.attempts + 1;
      await markWebhookDeliveryResult(row.id, {
        status: attempts >= 5 ? "failed" : "pending",
        attempts,
        lastError: error instanceof Error ? error.message : "Delivery failed",
      });
      failed += 1;
    }
  }

  return { processed: rows.length, delivered, failed };
}
