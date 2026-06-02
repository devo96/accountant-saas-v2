"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type Ctx = {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const NotifCtx = createContext<Ctx>({ notifications: [], unreadCount: 0, markRead: async () => {}, refresh: async () => {} });

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const es = new EventSource("/api/notifications/stream");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setNotifications((prev) => {
          const existing = new Map(prev.map((n) => [n.id, n]));
          for (const n of data) existing.set(n.id, n);
          return Array.from(existing.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      } catch {}
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotifCtx.Provider value={{ notifications, unreadCount, markRead, refresh: fetchNotifications }}>
      {children}
    </NotifCtx.Provider>
  );
}

export const useNotifications = () => useContext(NotifCtx);
