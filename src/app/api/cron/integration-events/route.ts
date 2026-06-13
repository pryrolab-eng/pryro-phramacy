import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { storeListExpiryAlerts, storeStockAlerts } from "@/lib/db/inventory-store";
import { dispatchIntegrationWebhookEvent } from "@/lib/integrations/v1/webhook-deliver";

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === secret) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pharmacies = await prisma.pharmacies.findMany({
      where: { status: "active" },
      select: { id: true, name: true },
      take: 200,
    });

    let lowStockEvents = 0;
    let expiringEvents = 0;

    for (const pharmacy of pharmacies) {
      const [stockAlerts, expiryAlerts] = await Promise.all([
        storeStockAlerts(pharmacy.id),
        storeListExpiryAlerts(pharmacy.id, 30),
      ]);

      if (stockAlerts.lowStock.length > 0) {
        await dispatchIntegrationWebhookEvent({
          eventType: "inventory.low_stock",
          payload: {
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.name,
            items: stockAlerts.lowStock.slice(0, 20),
            count: stockAlerts.lowStock.length,
          },
        });
        lowStockEvents += 1;
      }

      if (expiryAlerts.length > 0) {
        await dispatchIntegrationWebhookEvent({
          eventType: "inventory.expiring_soon",
          payload: {
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.name,
            items: expiryAlerts.slice(0, 20),
            count: expiryAlerts.length,
            withinDays: 30,
          },
        });
        expiringEvents += 1;
      }
    }

    return NextResponse.json({
      success: true,
      pharmaciesScanned: pharmacies.length,
      lowStockEvents,
      expiringEvents,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("integration-events cron:", error);
    const message = error instanceof Error ? error.message : "Cron job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
