"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markNotificationRead } from "@/lib/http/notification-preferences";

export type LiveNotification = {
  id: string;
  title: string;
  message: string;
  type?: string | null;
  read?: boolean | null;
  date?: string | null;
  actionUrl?: string | null;
};

type UseNotificationStreamResult = {
  notifications: LiveNotification[];
  unreadCount: number;
  connected: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
};

export function useNotificationStream(): UseNotificationStreamResult {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const seenIds = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as LiveNotification[];
    setNotifications(data);
    for (const item of data) {
      if (item.id) seenIds.current.add(item.id);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          notification?: LiveNotification;
        };
        if (payload.type !== "notification" || !payload.notification?.id) {
          return;
        }
        const item = payload.notification;
        if (seenIds.current.has(item.id)) return;
        seenIds.current.add(item.id);
        setNotifications((current) => [item, ...current].slice(0, 50));
      } catch {
        /* ignore malformed events */
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await markNotificationRead(id);
    } catch {
      void refresh();
    }
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, connected, refresh, markRead };
}
