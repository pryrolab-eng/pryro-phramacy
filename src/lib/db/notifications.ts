import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type NotificationListItem = {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean | null;
  created_at: Date | null;
  action_url: string | null;
};

export type OutboxRow = {
  id: string;
  event_type: string;
  pharmacy_id: string | null;
  user_id: string | null;
  payload: Record<string, unknown>;
  attempts: number;
};

export type NotificationChannelPrefsRow = {
  channelInApp: boolean;
  channelEmail: boolean;
  channelPush: boolean;
};

export async function enqueueNotificationOutboxFromDb(input: {
  eventType: string;
  pharmacyId?: string | null;
  userId?: string | null;
  payload: Record<string, unknown>;
}): Promise<string> {
  const row = await prisma.notification_outbox.create({
    data: {
      event_type: input.eventType,
      pharmacy_id: input.pharmacyId ?? null,
      user_id: input.userId ?? null,
      payload: input.payload as Prisma.InputJsonValue,
      status: "pending",
    },
    select: { id: true },
  });
  return row.id;
}

export async function listPendingOutboxRowsFromDb(
  limit: number,
  maxAttempts: number,
): Promise<OutboxRow[]> {
  const rows = await prisma.notification_outbox.findMany({
    where: { status: "pending", attempts: { lt: maxAttempts } },
    orderBy: { created_at: "asc" },
    take: limit,
    select: {
      id: true,
      event_type: true,
      pharmacy_id: true,
      user_id: true,
      payload: true,
      attempts: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    event_type: row.event_type,
    pharmacy_id: row.pharmacy_id,
    user_id: row.user_id,
    payload: (row.payload as Record<string, unknown>) ?? {},
    attempts: row.attempts,
  }));
}

export async function updateOutboxRowFromDb(
  id: string,
  data: {
    status: "processed" | "failed" | "pending";
    errorMessage?: string | null;
    incrementAttempts?: boolean;
  },
): Promise<void> {
  await prisma.notification_outbox.update({
    where: { id },
    data: {
      status: data.status,
      processed_at: data.status === "processed" ? new Date() : null,
      last_error: data.errorMessage ?? null,
      ...(data.incrementAttempts ? { attempts: { increment: 1 } } : {}),
    },
  });
}

export async function insertNotificationFromDb(input: {
  pharmacyId?: string | null;
  userId?: string | null;
  title: string;
  message: string;
  type: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const row = await prisma.notifications.create({
    data: {
      pharmacy_id: input.pharmacyId ?? null,
      user_id: input.userId ?? null,
      title: input.title,
      message: input.message,
      type: input.type,
      is_read: false,
      action_url: input.actionUrl ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return row.id;
}

export async function insertDeliveryLogFromDb(input: {
  notificationId?: string | null;
  outboxId: string;
  channel: string;
  status: string;
  error?: string | null;
}): Promise<void> {
  await prisma.notification_delivery_log.create({
    data: {
      notification_id: input.notificationId ?? null,
      outbox_id: input.outboxId,
      channel: input.channel,
      status: input.status,
      error: input.error ?? null,
    },
  });
}

export async function listNotificationsForPharmacyFromDb(
  pharmacyId: string,
  limit = 50,
): Promise<NotificationListItem[]> {
  return prisma.notifications.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      is_read: true,
      created_at: true,
      action_url: true,
    },
  });
}

/** Platform admin feed: rows with no pharmacy (platform-scoped). */
export async function listPlatformNotificationsFromDb(
  limit = 50,
): Promise<NotificationListItem[]> {
  return prisma.notifications.findMany({
    where: { pharmacy_id: null },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      is_read: true,
      created_at: true,
      action_url: true,
    },
  });
}

export async function listNotificationsSinceFromDb(
  pharmacyId: string,
  since: Date,
  limit = 20,
): Promise<NotificationListItem[]> {
  return prisma.notifications.findMany({
    where: {
      pharmacy_id: pharmacyId,
      created_at: { gt: since },
    },
    orderBy: { created_at: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      is_read: true,
      created_at: true,
      action_url: true,
    },
  });
}

export async function listPlatformNotificationsSinceFromDb(
  since: Date,
  limit = 20,
): Promise<NotificationListItem[]> {
  return prisma.notifications.findMany({
    where: {
      pharmacy_id: null,
      created_at: { gt: since },
    },
    orderBy: { created_at: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      is_read: true,
      created_at: true,
      action_url: true,
    },
  });
}

export async function createPharmacyNotificationFromDb(input: {
  pharmacyId: string;
  title: string;
  message: string;
  type?: string;
}): Promise<NotificationListItem> {
  return prisma.notifications.create({
    data: {
      pharmacy_id: input.pharmacyId,
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      is_read: false,
    },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      is_read: true,
      created_at: true,
      action_url: true,
    },
  });
}

export type NotificationEventPrefs = {
  dailyUpdate: boolean;
  lowStock: boolean;
  expiry: boolean;
  salesReports: boolean;
  systemUpdates: boolean;
};

export type NotificationPrefsRow = NotificationChannelPrefsRow &
  NotificationEventPrefs;

const DEFAULT_EVENT_PREFS: NotificationEventPrefs = {
  dailyUpdate: true,
  lowStock: true,
  expiry: true,
  salesReports: false,
  systemUpdates: true,
};

function parseEventPrefs(value: unknown): NotificationEventPrefs {
  if (!value || typeof value !== "object") return DEFAULT_EVENT_PREFS;
  const o = value as Record<string, unknown>;
  return {
    dailyUpdate: typeof o.dailyUpdate === "boolean" ? o.dailyUpdate : true,
    lowStock: typeof o.lowStock === "boolean" ? o.lowStock : true,
    expiry: typeof o.expiry === "boolean" ? o.expiry : true,
    salesReports: typeof o.salesReports === "boolean" ? o.salesReports : false,
    systemUpdates: typeof o.systemUpdates === "boolean" ? o.systemUpdates : true,
  };
}

export async function markNotificationReadFromDb(
  notificationId: string,
  pharmacyId: string | null,
): Promise<boolean> {
  const result = await prisma.notifications.updateMany({
    where: {
      id: notificationId,
      pharmacy_id: pharmacyId,
    },
    data: { is_read: true },
  });
  return result.count > 0;
}

export async function getNotificationPrefsFromDb(
  userId: string,
  pharmacyId: string | null,
): Promise<NotificationPrefsRow | null> {
  const row = await prisma.notification_preferences.findFirst({
    where: {
      user_id: userId,
      pharmacy_id: pharmacyId,
    },
    select: {
      channel_in_app: true,
      channel_email: true,
      channel_push: true,
      event_prefs: true,
    },
  });
  if (!row) return null;
  const events = parseEventPrefs(row.event_prefs);
  return {
    channelInApp: row.channel_in_app,
    channelEmail: row.channel_email,
    channelPush: row.channel_push,
    ...events,
  };
}

export async function upsertNotificationPrefsFromDb(
  userId: string,
  pharmacyId: string,
  prefs: NotificationPrefsRow,
): Promise<NotificationPrefsRow> {
  const eventPrefs = {
    dailyUpdate: prefs.dailyUpdate,
    lowStock: prefs.lowStock,
    expiry: prefs.expiry,
    salesReports: prefs.salesReports,
    systemUpdates: prefs.systemUpdates,
  };

  const row = await prisma.notification_preferences.upsert({
    where: {
      user_id_pharmacy_id: {
        user_id: userId,
        pharmacy_id: pharmacyId,
      },
    },
    create: {
      user_id: userId,
      pharmacy_id: pharmacyId,
      channel_in_app: prefs.channelInApp,
      channel_email: prefs.channelEmail,
      channel_push: prefs.channelPush,
      event_prefs: eventPrefs,
    },
    update: {
      channel_in_app: prefs.channelInApp,
      channel_email: prefs.channelEmail,
      channel_push: prefs.channelPush,
      event_prefs: eventPrefs,
      updated_at: new Date(),
    },
    select: {
      channel_in_app: true,
      channel_email: true,
      channel_push: true,
      event_prefs: true,
    },
  });

  return {
    channelInApp: row.channel_in_app,
    channelEmail: row.channel_email,
    channelPush: row.channel_push,
    ...parseEventPrefs(row.event_prefs),
  };
}

export async function getNotificationChannelPrefsFromDb(
  userId: string,
  pharmacyId: string | null,
): Promise<NotificationChannelPrefsRow | null> {
  const row = await getNotificationPrefsFromDb(userId, pharmacyId);
  if (!row) return null;
  return {
    channelInApp: row.channelInApp,
    channelEmail: row.channelEmail,
    channelPush: row.channelPush,
  };
}
