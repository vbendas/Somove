"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Home, CalendarDays, MessageSquare, HelpCircle } from "lucide-react";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";

export function ClientNav({ userId }: { userId?: string }) {
  const unreadCount = useUnreadMessageCount(userId);

  return (
    <BottomNav
      items={[
        { label: "Home", href: "/", icon: Home },
        { label: "Sessions", href: "/my-sessions", icon: CalendarDays },
        { label: "Inbox", href: "/inbox", icon: MessageSquare, badge: unreadCount },
        { label: "Help", href: "/emergency", icon: HelpCircle },
      ]}
    />
  );
}
