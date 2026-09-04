"use client";

import { BottomNav, type NavItem } from "@/components/layout/bottom-nav";
import { Home, CalendarDays, MessageSquare, HelpCircle } from "lucide-react";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";

export const CLIENT_HOME_ALIASES = ["/", "/dashboard"];

export function getClientNavItems(unreadCount: number): NavItem[] {
  return [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Sessions", href: "/my-sessions", icon: CalendarDays },
    { label: "Inbox", href: "/inbox", icon: MessageSquare, badge: unreadCount },
    { label: "Help", href: "/emergency", icon: HelpCircle },
  ];
}

export function ClientNav({ userId }: { userId?: string }) {
  const unreadCount = useUnreadMessageCount(userId);

  return (
    <BottomNav
      items={getClientNavItems(unreadCount)}
      homeAliases={CLIENT_HOME_ALIASES}
    />
  );
}
