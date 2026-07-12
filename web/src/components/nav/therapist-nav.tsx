"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { LayoutDashboard, CalendarDays, Users, MessageSquare, Settings } from "lucide-react";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";

export function TherapistNav({ userId }: { userId?: string }) {
  const unreadCount = useUnreadMessageCount(userId);

  return (
    <BottomNav
      items={[
        { label: "Today", href: "/dashboard", icon: LayoutDashboard },
        { label: "Schedule", href: "/dashboard/schedule", icon: CalendarDays },
        { label: "Clients", href: "/dashboard/clients", icon: Users },
        { label: "Inbox", href: "/dashboard/inbox", icon: MessageSquare, badge: unreadCount },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ]}
    />
  );
}
