"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { LayoutDashboard, CalendarDays, Users, MessageSquare, Settings } from "lucide-react";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function TherapistNav() {
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
        { label: "Today", href: "/dashboard", icon: LayoutDashboard },
        { label: "Schedule", href: "/dashboard/schedule", icon: CalendarDays },
        { label: "Clients", href: "/dashboard/clients", icon: Users },
        { label: "Inbox", href: "/dashboard/inbox", icon: MessageSquare, badge: unreadCount },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ]}
    />
  );
}
