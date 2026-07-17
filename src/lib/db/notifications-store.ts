import { isPrismaConfigured } from "@/lib/db/is-prisma-configured";
import {
  createPharmacyNotificationFromDb,
  enqueueNotificationOutboxFromDb,
  getNotificationChannelPrefsFromDb,
  insertDeliveryLogFromDb,
  insertNotificationFromDb,
  listNotificationsForPharmacyFromDb,
  listNotificationsSinceFromDb,
  listPlatformNotificationsFromDb,
  listPlatformNotificationsSinceFromDb,
  listPendingOutboxRowsFromDb,
  markNotificationReadFromDb,
  updateOutboxRowFromDb,
  upsertNotificationPrefsFromDb,
  getNotificationPrefsFromDb,
  type NotificationChannelPrefsRow,
  type NotificationListItem,
  type NotificationPrefsRow,
  type OutboxRow,
} from "@/lib/db/notifications";

function requirePrisma(): void {
  if (!isPrismaConfigured()) {
    throw new Error("DATABASE_URL is required for notifications (Prisma)");
  }
}

export type {
  NotificationChannelPrefsRow,
  NotificationListItem,
  NotificationPrefsRow,
  OutboxRow,
};

export async function storeEnqueueNotificationOutbox(
  input: Parameters<typeof enqueueNotificationOutboxFromDb>[0],
): Promise<string> {
  requirePrisma();
  return enqueueNotificationOutboxFromDb(input);
}

export async function storeListPendingOutboxRows(
  limit: number,
  maxAttempts: number,
): Promise<OutboxRow[]> {
  requirePrisma();
  return listPendingOutboxRowsFromDb(limit, maxAttempts);
}

export async function storeUpdateOutboxRow(
  ...args: Parameters<typeof updateOutboxRowFromDb>
): Promise<void> {
  requirePrisma();
  return updateOutboxRowFromDb(...args);
}

export async function storeInsertNotification(
  input: Parameters<typeof insertNotificationFromDb>[0],
): Promise<string> {
  requirePrisma();
  return insertNotificationFromDb(input);
}

export async function storeInsertDeliveryLog(
  input: Parameters<typeof insertDeliveryLogFromDb>[0],
): Promise<void> {
  requirePrisma();
  return insertDeliveryLogFromDb(input);
}

export async function storeListNotificationsForPharmacy(
  pharmacyId: string,
  limit?: number,
): Promise<NotificationListItem[]> {
  requirePrisma();
  return listNotificationsForPharmacyFromDb(pharmacyId, limit);
}

export async function storeListPlatformNotifications(
  limit?: number,
): Promise<NotificationListItem[]> {
  requirePrisma();
  return listPlatformNotificationsFromDb(limit);
}

export async function storeListNotificationsSince(
  pharmacyId: string,
  since: Date,
  limit?: number,
): Promise<NotificationListItem[]> {
  requirePrisma();
  return listNotificationsSinceFromDb(pharmacyId, since, limit);
}

export async function storeListPlatformNotificationsSince(
  since: Date,
  limit?: number,
): Promise<NotificationListItem[]> {
  requirePrisma();
  return listPlatformNotificationsSinceFromDb(since, limit);
}

export async function storeCreatePharmacyNotification(
  input: Parameters<typeof createPharmacyNotificationFromDb>[0],
): Promise<NotificationListItem> {
  requirePrisma();
  return createPharmacyNotificationFromDb(input);
}

export async function storeGetNotificationChannelPrefs(
  userId: string,
  pharmacyId: string | null,
): Promise<NotificationChannelPrefsRow | null> {
  requirePrisma();
  return getNotificationChannelPrefsFromDb(userId, pharmacyId);
}

export async function storeMarkNotificationRead(
  notificationId: string,
  pharmacyId: string | null,
): Promise<boolean> {
  requirePrisma();
  return markNotificationReadFromDb(notificationId, pharmacyId);
}

export async function storeGetNotificationPrefs(
  userId: string,
  pharmacyId: string,
): Promise<NotificationPrefsRow | null> {
  requirePrisma();
  return getNotificationPrefsFromDb(userId, pharmacyId);
}

export async function storeUpsertNotificationPrefs(
  userId: string,
  pharmacyId: string,
  prefs: NotificationPrefsRow,
): Promise<NotificationPrefsRow> {
  requirePrisma();
  return upsertNotificationPrefsFromDb(userId, pharmacyId, prefs);
}
