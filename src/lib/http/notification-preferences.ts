import { fetchJson } from "./client";

export const notificationPrefsKeys = {
  all: ["notifications", "preferences"] as const,
};

export type NotificationPrefsApi = {
  dailyUpdate: boolean;
  lowStock: boolean;
  expiry: boolean;
  salesReports: boolean;
  systemUpdates: boolean;
  email: boolean;
  desktop: boolean;
  push: boolean;
};

export async function getNotificationPreferences(): Promise<NotificationPrefsApi> {
  return fetchJson<NotificationPrefsApi>("/api/notifications/preferences");
}

export async function updateNotificationPreferences(
  body: NotificationPrefsApi,
): Promise<NotificationPrefsApi> {
  return fetchJson<NotificationPrefsApi>("/api/notifications/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetchJson(`/api/notifications/${id}/read`, { method: "PATCH" });
}
