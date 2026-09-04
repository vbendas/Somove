"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Search,
  MessageSquare,
  Paperclip,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTime } from "@/lib/format";

interface Conversation {
  id: string;
  client_id: string;
  status: string;
  last_message_at: string | null;
  client: { id: string; name: string | null; email: string } | null;
  lastMessage: { body: string; sent_at: string; sender_id: string } | null;
  tags: { id: string; name: string; colour: string }[];
  unreadCount: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  read_at: string | null;
  attachments?: { id: string; file_url: string; file_name: string; file_size: number; mime_type: string }[];
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { getConversations } = await import("@/app/actions/messaging");
      const result = await getConversations({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      if (result.data) setConversations(result.data);
    } catch {
      toast.error("Failed to load conversations");
    }
    setLoading(false);
  }, [statusFilter, search]);

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

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const { getMessages, markAsRead } = await import("@/app/actions/messaging");
      const result = await getMessages(convId);
      if (result.data) setMessages(result.data);
      markAsRead(convId).catch(() => {});
    } catch {
      toast.error("Failed to load messages");
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
    }
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, supabase]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      const { sendMessage } = await import("@/app/actions/messaging");
      const result = await sendMessage(selectedId, newMessage);
      if (result.error) {
        toast.error(result.error.message);
      } else {
        setNewMessage("");
      }
    } catch {
      toast.error("Failed to send message");
    }
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    try {
      const { sendMessage, uploadAttachment } = await import("@/app/actions/messaging");
      const msgResult = await sendMessage(selectedId, `📎 ${file.name}`);
      if (msgResult.data) {
        await uploadAttachment(msgResult.data.id, file);
        fetchMessages(selectedId);
      }
    } catch {
      toast.error("Failed to upload file");
    }
    e.target.value = "";
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <PageContainer width="full">
      <PageHeader title="Inbox" />

      <div className="flex flex-col md:flex-row gap-4 md:h-[calc(100vh-200px)]">
          <div
            className={`w-full md:w-80 flex-shrink-0 flex flex-col ${
              selectedId ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray" />
              <Input
                placeholder="Search clients..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="mb-3 flex gap-1 rounded-card bg-surface p-1">
              {["all", "open", "pending", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className={`flex-1 rounded-button px-2 py-1.5 text-xs font-medium transition-colors capitalize ${
                    statusFilter === s
                      ? "bg-background text-foreground shadow-sm"
                      : "text-warm-gray hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-card bg-surface" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No conversations" />
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    aria-pressed={selectedId === conv.id}
                    className={`w-full rounded-card p-3 text-left transition-all ${
                      selectedId === conv.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-surface border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {conv.client?.name || conv.client?.email || "Client"}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-warm-gray">
                      {conv.lastMessage?.body || "No messages yet"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {conv.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${tag.colour}20`,
                            color: tag.colour,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div
            className={`flex-1 flex flex-col ${
              !selectedId ? "hidden md:flex" : "flex"
            }`}
          >
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState icon={MessageSquare} title="Select a conversation" />
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setSelectedId(null)}
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedConv?.client?.name || selectedConv?.client?.email}
                    </p>
                    <p className="text-xs text-warm-gray">{selectedConv?.client?.email}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <select
                      aria-label="Conversation status"
                      value={selectedConv?.status || "open"}
                      onChange={async (e) => {
                        const { updateConversationStatus } = await import("@/app/actions/messaging");
                        await updateConversationStatus(
                          selectedId,
                          e.target.value as "open" | "pending" | "closed"
                        );
                        fetchConversations();
                      }}
                      className="rounded-card border border-input bg-transparent px-2 py-1 text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto rounded-card border border-border bg-surface p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-warm-gray">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === userId ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-card px-4 py-2 ${
                            msg.sender_id === userId
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              msg.sender_id === userId
                                ? "text-primary-foreground/70"
                                : "text-warm-gray"
                            }`}
                          >
                            {formatTime(msg.sent_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="mt-3 flex items-end gap-2">
                  <label className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-card border border-border text-warm-gray hover:text-foreground" aria-label="Attach file">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.txt"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
    </PageContainer>
  );
}
