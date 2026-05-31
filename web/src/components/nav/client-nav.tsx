"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Home, CalendarDays, MessageSquare, HelpCircle } from "lucide-react";

export function ClientNav() {
  return (
    <BottomNav
      items={[
        { label: "Home", href: "/", icon: Home },
        { label: "Sessions", href: "/my-sessions", icon: CalendarDays },
        { label: "Inbox", href: "/inbox", icon: MessageSquare },
        { label: "Help", href: "/emergency", icon: HelpCircle },
      ]}
    />
  );
}
