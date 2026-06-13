import { storeGetNotificationChannelPrefs } from "@/lib/db/notifications-store";

export type NotificationChannelPrefs = {
  channelInApp: boolean;
  channelEmail: boolean;
  channelPush: boolean;
};

const DEFAULT_PREFS: NotificationChannelPrefs = {
  channelInApp: true,
  channelEmail: true,
  channelPush: false,
};

export async function getNotificationChannelPrefs(
  userId: string,
  pharmacyId: string | null,
): Promise<NotificationChannelPrefs> {
  try {
    const row = await storeGetNotificationChannelPrefs(userId, pharmacyId);
    if (!row) return DEFAULT_PREFS;
    return row;
  } catch {
    return DEFAULT_PREFS;
  }
}
