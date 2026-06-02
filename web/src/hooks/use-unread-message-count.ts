"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadMessageCount(userId?: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    async function fetchCount() {
      const supabase = createClient();

      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .or(`therapist_id.eq.${userId},client_id.eq.${userId}`);

      if (!conversations || conversations.length === 0) return;

      const convIds = conversations.map((c) => c.id);

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .neq("sender_id", userId)
        .is("read_at", null);

      setCount(unreadCount || 0);
    }

    fetchCount();

    const supabase = createClient();
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}
