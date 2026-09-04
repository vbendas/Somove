"use client";

import { BottomNav, type NavItem } from "@/components/layout/bottom-nav";
import { LayoutDashboard, CalendarDays, Users, MessageSquare, Settings } from "lucide-react";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";

export function getTherapistNavItems(unreadCount: number): NavItem[] {
  return [
    { label: "Today", href: "/professional/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Schedule", href: "/professional/dashboard/schedule", icon: CalendarDays },
    { label: "Clients", href: "/professional/dashboard/clients", icon: Users },
    { label: "Inbox", href: "/professional/dashboard/inbox", icon: MessageSquare, badge: unreadCount },
    { label: "Settings", href: "/professional/dashboard/settings", icon: Settings },
  ];
}

export function TherapistNav({ userId }: { userId?: string }) {
  const unreadCount = useUnreadMessageCount(userId);

  return <BottomNav items={getTherapistNavItems(unreadCount)} />;
}
