import { getEnableNotifications } from "@/lib/platform-settings";
import { storeEnqueueNotificationOutbox } from "@/lib/db/notifications-store";

export type NotificationEventInput = {
  eventType: string;
  pharmacyId?: string | null;
  userId?: string | null;
  payload?: Record<string, unknown>;
};

export type EmitNotificationOptions = {
  /**
   * When true (default), process the outbox right after enqueue — like a Nest
   * @OnEvent listener. Cron remains a safety net for failed rows.
   */
  dispatchImmediately?: boolean;
};

export async function emitNotificationEvent(
  input: NotificationEventInput,
  options?: EmitNotificationOptions,
): Promise<string | null> {
  if (!(await getEnableNotifications())) return null;

  const payload = input.payload ?? {};
  const dispatchImmediately = options?.dispatchImmediately !== false;

  try {
    const outboxId = await storeEnqueueNotificationOutbox({
      eventType: input.eventType,
      pharmacyId: input.pharmacyId,
      userId: input.userId,
      payload,
    });
    if (dispatchImmediately) {
      await dispatchAfterEnqueue();
    }
    return outboxId;
  } catch (error) {
    console.error("emitNotificationEvent:", error);
    return null;
  }
}

async function dispatchAfterEnqueue(): Promise<void> {
  try {
    const { dispatchPendingNotifications } = await import("./dispatch");
    await dispatchPendingNotifications();
  } catch (error) {
    console.error("emitNotificationEvent dispatch:", error);
  }
}
