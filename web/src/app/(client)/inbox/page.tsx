"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/format";

interface Conversation {
  id: string;
  therapist_id: string;
  last_message_at: string | null;
  therapist: { name: string | null } | null;
  lastMessage: { body: string; sent_at: string; sender_id: string } | null;
  unreadCount: number;
}

export default function ClientInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: convs } = await supabase
        .from("conversations")
        .select("*, therapist:users!conversations_therapist_id_fkey(name)")
        .eq("client_id", user.id)
        .order("last_message_at", { ascending: false, nullsFirst: true });

      if (!convs) return;

      const enriched: Conversation[] = [];
      for (const conv of convs) {
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, sent_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("sent_at", { ascending: false })
          .limit(1)
          .single();

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        enriched.push({
          ...conv,
          lastMessage: lastMsg
            ? { body: lastMsg.content, sent_at: lastMsg.sent_at, sender_id: lastMsg.sender_id }
            : null,
          unreadCount: unreadCount || 0,
        });
      }

      setConversations(enriched);
    } catch {
      toast.error("Failed to load conversations");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const channel = supabase
      .channel("messages-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchConversations]);

  return (
    <PageContainer width="narrow">
      <PageHeader title="Inbox" />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-surface" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No conversations yet" />
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/inbox/${conv.id}`)}
              className="w-full"
            >
              <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-medium text-primary">
                    {(conv.therapist?.name || "T").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">
                        {conv.therapist?.name || "Professional"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-warm-gray">
                      {conv.lastMessage?.body || "No messages yet"}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-warm-gray/70">
                        {formatDate(conv.lastMessage.sent_at, "short")} at{" "}
                        {formatTime(conv.lastMessage.sent_at)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
