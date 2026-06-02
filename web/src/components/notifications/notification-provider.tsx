"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "@/app/actions/notifications";
import { toast } from "sonner";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const hasFetched = useRef(false);

  const fetchInitial = useCallback(async () => {
    const [notifResult, countResult] = await Promise.all([
      getNotifications(15),
      getUnreadCount(),
    ]);

    if (notifResult.notifications) {
      setNotifications(notifResult.notifications);
    }
    if (countResult.count !== undefined) {
      setUnreadCount(countResult.count);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchInitial();
    }
  }, [fetchInitial]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          toast(newNotif.title, {
            description: newNotif.body,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const updated = payload.new as Notification;
          if (updated.read_at && !payload.old.read_at) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) =>
        n.read_at ? n : { ...n, read_at: new Date().toISOString() }
      )
    );
    setUnreadCount(0);
  }, []);

  const loadMore = useCallback(async () => {
    setLoading(true);
    const last = notifications[notifications.length - 1];
    if (last) {
      const result = await getNotifications(15, last.created_at);
      if (result.notifications) {
        setNotifications((prev) => [...prev, ...result.notifications!]);
      }
    }
    setLoading(false);
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        open,
        setOpen,
        markRead,
        markAllRead,
        loadMore,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
