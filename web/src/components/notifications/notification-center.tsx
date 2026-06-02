"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "./notification-provider";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Calendar,
  MessageSquare,
  CreditCard,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  booking_confirmed: Calendar,
  session_reminder: Clock,
  session_cancelled: XCircle,
  new_message: MessageSquare,
  payment_received: CreditCard,
};

const typeColors: Record<string, string> = {
  booking_confirmed: "text-primary",
  session_reminder: "text-blue-500",
  session_cancelled: "text-red-500",
  new_message: "text-accent",
  payment_received: "text-green-600",
};

export function NotificationCenter({ onNotificationClick }: { onNotificationClick?: () => void }) {
  const { notifications, unreadCount, loading, markRead, markAllRead, loadMore } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = useCallback(
    async (id: string, link: string | null) => {
      await markRead(id);
      setIsOpen(false);
      if (link) {
        window.location.href = link;
      }
      onNotificationClick?.();
    },
    [markRead, onNotificationClick]
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-heading text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllRead}
                className="h-auto p-0 text-xs text-primary"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-warm-gray" />
                <p className="text-sm text-warm-gray">No notifications yet</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  const color = typeColors[notification.type] || "text-warm-gray";
                  const isUnread = !notification.read_at;

                  return (
                    <button
                      key={notification.id}
                      onClick={() =>
                        handleNotificationClick(notification.id, notification.link)
                      }
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        isUnread && "bg-primary/5"
                      )}
                    >
                      <div className={cn("mt-0.5", color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "text-sm",
                              isUnread ? "font-medium" : "text-muted-foreground"
                            )}
                          >
                            {notification.title}
                          </p>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-warm-gray">
                          {notification.body}
                        </p>
                        <p className="mt-1 text-[10px] text-warm-gray">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {loading && (
                  <div className="flex justify-center py-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}

                {!loading && notifications.length >= 15 && (
                  <button
                    onClick={loadMore}
                    className="flex w-full items-center justify-center gap-1 py-3 text-xs text-primary hover:underline"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Load more
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
