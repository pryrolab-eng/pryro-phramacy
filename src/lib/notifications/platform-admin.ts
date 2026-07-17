import { emitNotificationEvent } from "@/lib/notifications/emit";

export const PLATFORM_ADMIN_EVENT = {
  pharmacyRegistered: "platform.pharmacy_registered",
  subscriptionPaid: "platform.subscription_paid",
  subscriptionCancelled: "platform.subscription_cancelled",
  maintenanceQueued: "platform.maintenance",
} as const;

/** In-app (and optional email) alerts for platform admins — pharmacy_id is always null. */
export async function emitPlatformAdminNotification(input: {
  eventType: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  payload?: Record<string, unknown>;
}): Promise<string | null> {
  return emitNotificationEvent({
    eventType: input.eventType,
    pharmacyId: null,
    userId: null,
    payload: {
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      actionUrl: input.actionUrl,
      ...(input.payload ?? {}),
    },
  });
}
