"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { LayoutDashboard, CalendarDays, Users, Settings } from "lucide-react";

export function TherapistNav() {
  return (
    <BottomNav
      items={[
        { label: "Today", href: "/dashboard", icon: LayoutDashboard },
        { label: "Schedule", href: "/dashboard/schedule", icon: CalendarDays },
        { label: "Clients", href: "/dashboard/clients", icon: Users },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ]}
    />
  );
}
