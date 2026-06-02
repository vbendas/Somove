"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Home, CalendarDays, MessageSquare, HelpCircle } from "lucide-react";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function ClientNav() {
  const [userId, setUserId] = useState<string | undefined>();
  const unreadCount = useUnreadMessageCount(userId);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

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
