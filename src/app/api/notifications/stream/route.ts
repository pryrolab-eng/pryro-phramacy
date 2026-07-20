import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeListNotificationsSince,
  storeListPlatformNotificationsSince,
} from "@/lib/db/notifications-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 10_000;

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const wantPlatform =
    request.nextUrl.searchParams.get("scope") === "platform";

  if (wantPlatform) {
    const isPlatformAdmin = await resolveIsAppPlatformAdmin(user.id);
    if (!isPlatformAdmin) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let pharmacyId: string | null = null;
  if (!wantPlatform) {
    try {
      pharmacyId = await requireUserPharmacyId(user.id);
    } catch {
      return new Response("Pharmacy not found", { status: 404 });
    }
  }

  const encoder = new TextEncoder();
  let lastSeen = new Date();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      send({
        type: "connected",
        scope: wantPlatform ? "platform" : "pharmacy",
        pharmacyId,
      });

      const poll = async () => {
        if (closed) return;
        try {
          const rows = wantPlatform
            ? await storeListPlatformNotificationsSince(lastSeen)
            : await storeListNotificationsSince(pharmacyId!, lastSeen);

          for (const row of rows) {
            if (row.created_at) {
              lastSeen = row.created_at;
            }
            send({
              type: "notification",
              notification: {
                id: row.id,
                title: row.title,
                message: row.message,
                type: row.type,
                read: row.is_read,
                date: row.created_at,
                actionUrl: row.action_url,
              },
            });
          }
        } catch (error) {
          console.error("notifications stream poll:", error);
        }
      };

      const interval = setInterval(() => {
        void poll();
      }, POLL_MS);
      void poll();

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
