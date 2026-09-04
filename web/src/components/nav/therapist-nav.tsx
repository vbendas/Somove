"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { LayoutDashboard, CalendarDays, Users, MessageSquare, Settings } from "lucide-react";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";

export function TherapistNav({ userId }: { userId?: string }) {
  const unreadCount = useUnreadMessageCount(userId);

  return (
    <BottomNav
      items={[
        { label: "Today", href: "/professional/dashboard", icon: LayoutDashboard },
        { label: "Schedule", href: "/professional/dashboard/schedule", icon: CalendarDays },
        { label: "Clients", href: "/professional/dashboard/clients", icon: Users },
        { label: "Inbox", href: "/professional/dashboard/inbox", icon: MessageSquare, badge: unreadCount },
        { label: "Settings", href: "/professional/dashboard/settings", icon: Settings },
      ]}
    />
  );
}
