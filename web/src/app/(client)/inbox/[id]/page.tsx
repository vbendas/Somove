"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  read_at: string | null;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase]);

  const fetchMessages = useCallback(async () => {
    try {
      const { getMessages, markAsRead } = await import("@/app/actions/messaging");
      const result = await getMessages(conversationId);
      if (result.data) setMessages(result.data);
      markAsRead(conversationId).catch(() => {});
    } catch {
      toast.error("Failed to load messages");
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const { sendMessage } = await import("@/app/actions/messaging");
      const result = await sendMessage(conversationId, newMessage);
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
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    try {
      const { sendMessage, uploadAttachment } = await import("@/app/actions/messaging");
      const msgResult = await sendMessage(conversationId, `📎 ${file.name}`);
      if (msgResult.data) {
        await uploadAttachment(msgResult.data.id, file);
        fetchMessages();
      }
    } catch {
      toast.error("Failed to upload file");
    }
    e.target.value = "";
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/inbox")} aria-label="Back to inbox">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="font-medium text-foreground">Conversation</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-12 w-3/4 animate-pulse rounded-card ${
                  i % 2 === 0 ? "ml-auto bg-primary/10" : "bg-surface"
                }`}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-warm-gray">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_id === userId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-card px-4 py-2 ${
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
                  {new Date(msg.sent_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
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
      </div>
    </div>
  );
}
