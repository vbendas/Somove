"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type Tag = Database["public"]["Tables"]["tags"]["Row"];
type Attachment = Database["public"]["Tables"]["attachments"]["Row"];

interface MessageWithAttachments extends Message {
  attachments: Attachment[];
}

interface ConversationWithDetails extends Conversation {
  client: { id: string; name: string | null; email: string } | null;
  lastMessage: { body: string; sent_at: string; sender_id: string } | null;
  tags: Tag[];
  unreadCount: number;
}

interface ActionResult<T = void> {
  data: T | null;
  error: { message: string } | null;
}

async function verifyConversationMembership(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  userId: string
) {
  const { data: conv, error } = await supabase
    .from("conversations")
    .select("client_id, therapist_id")
    .eq("id", conversationId)
    .single();

  if (error || !conv) return null;
  if (conv.client_id !== userId && conv.therapist_id !== userId) return null;
  return conv;
}

export async function getConversations(filters?: {
  status?: string;
  search?: string;
  tagId?: string;
}): Promise<ActionResult<ConversationWithDetails[]>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    let query = supabase
      .from("conversations")
      .select(
        "*, client:users!conversations_client_id_fkey(id, name, email), conversation_tags(tag_id, tags(id, name, colour))"
      )
      .eq("therapist_id", user.id)
      .order("last_message_at", { ascending: false, nullsFirst: true });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.or(
        `client.name.ilike.%${filters.search}%,client.email.ilike.%${filters.search}%`
      );
    }

    const { data: conversations, error } = await query;
    if (error) return { data: null, error: { message: error.message } };

    const convList = conversations || [];
    const convIds = convList.map((c) => c.id);

    const lastMessageMap = new Map<
      string,
      { content: string; sent_at: string; sender_id: string }
    >();
    const unreadCountMap = new Map<string, number>();

    if (convIds.length > 0) {
      const [{ data: lastMessages }, { data: unreadRows }] = await Promise.all([
        supabase
          .from("messages")
          .select("id, conversation_id, content, sender_id, sent_at")
          .in("conversation_id", convIds)
          .order("sent_at", { ascending: false }),
        supabase
          .from("messages")
          .select("conversation_id")
          .neq("sender_id", user.id)
          .is("read_at", null)
          .in("conversation_id", convIds),
      ]);

      for (const msg of lastMessages || []) {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, {
            content: msg.content,
            sent_at: msg.sent_at,
            sender_id: msg.sender_id,
          });
        }
      }

      for (const row of unreadRows || []) {
        unreadCountMap.set(
          row.conversation_id,
          (unreadCountMap.get(row.conversation_id) || 0) + 1
        );
      }
    }

    const enriched: ConversationWithDetails[] = convList.map((conv) => {
      const tagLinks =
        (conv as unknown as {
          conversation_tags?: {
            tag_id: string;
            tags: { id: string; name: string; colour: string } | null;
          }[];
        }).conversation_tags || [];
      const tags = tagLinks
        .map((t) => t.tags)
        .filter((t): t is { id: string; name: string; colour: string } => t !== null)
        .map((t) => ({ id: t.id, name: t.name, colour: t.colour }) as unknown as Tag);
      const lastMsg = lastMessageMap.get(conv.id);
      return {
        ...conv,
        lastMessage: lastMsg
          ? { body: lastMsg.content, sent_at: lastMsg.sent_at, sender_id: lastMsg.sender_id }
          : null,
        tags,
        unreadCount: unreadCountMap.get(conv.id) || 0,
      };
    });

    if (filters?.tagId) {
      return {
        data: enriched.filter((c) => c.tags.some((t) => t.id === filters.tagId)),
        error: null,
      };
    }

    return { data: enriched, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function getMessages(
  conversationId: string
): Promise<ActionResult<MessageWithAttachments[]>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const conv = await verifyConversationMembership(
      supabase,
      conversationId,
      user.id
    );
    if (!conv)
      return {
        data: null,
        error: { message: "Conversation not found or access denied." },
      };

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*, attachments(*)")
      .eq("conversation_id", conversationId)
      .order("sent_at", { ascending: true });

    if (error) return { data: null, error: { message: error.message } };

    const enriched: MessageWithAttachments[] = (messages || []).map((msg) => {
      const attachments =
        (msg as unknown as { attachments?: Attachment[] }).attachments || [];
      return { ...(msg as Message), attachments };
    });

    return { data: enriched, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function sendMessage(
  conversationId: string,
  body: string
): Promise<ActionResult<Message>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const conv = await verifyConversationMembership(
      supabase,
      conversationId,
      user.id
    );
    if (!conv)
      return {
        data: null,
        error: { message: "Conversation not found or access denied." },
      };

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: body,
      })
      .select()
      .single();

    if (error) return { data: null, error: { message: error.message } };

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    const { getResendClient } = await import("@/lib/resend");
    const resend = getResendClient();
    if (resend) {
      const recipientId =
        conv.client_id === user.id ? conv.therapist_id : conv.client_id;

      const [{ data: recipientData }, { data: senderData }] =
        await Promise.all([
          supabase
            .from("users")
            .select("name, email")
            .eq("id", recipientId)
            .single(),
          supabase
            .from("users")
            .select("name")
            .eq("id", user.id)
            .single(),
        ]);

      if (recipientData && senderData) {
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("email_new_message")
          .eq("user_id", recipientId)
          .single();

        if (!prefs || prefs.email_new_message) {
          try {
            await resend.sendNewMessage({
              to: recipientData.email,
              recipientName: recipientData.name || "there",
              senderName: senderData.name || "Someone",
              messagePreview:
                body.length > 150 ? body.slice(0, 150) + "..." : body,
              conversationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/inbox/${conversationId}`,
            });
          } catch (e) {
            console.error("Failed to send message email notification:", e);
          }
        }
      }
    }

    return { data: message, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function markAsRead(
  conversationId: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const conv = await verifyConversationMembership(
      supabase,
      conversationId,
      user.id
    );
    if (!conv)
      return {
        data: null,
        error: { message: "Conversation not found or access denied." },
      };

    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) return { data: null, error: { message: error.message } };
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function getTags(): Promise<ActionResult<Tag[]>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("therapist_id", user.id)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function createTag(
  name: string,
  colour: string
): Promise<ActionResult<Tag>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
      .from("tags")
      .insert({
        therapist_id: user.id,
        name,
        colour,
        is_system: false,
      })
      .select()
      .single();

    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function deleteTag(tagId: string): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId)
      .eq("therapist_id", user.id)
      .eq("is_system", false);

    if (error) return { data: null, error: { message: error.message } };
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function addTagToConversation(
  conversationId: string,
  tagId: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const conv = await verifyConversationMembership(
      supabase,
      conversationId,
      user.id
    );
    if (!conv)
      return {
        data: null,
        error: { message: "Conversation not found or access denied." },
      };

    const { error } = await supabase
      .from("conversation_tags")
      .insert({ conversation_id: conversationId, tag_id: tagId });

    if (error) return { data: null, error: { message: error.message } };
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function removeTagFromConversation(
  conversationId: string,
  tagId: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const conv = await verifyConversationMembership(
      supabase,
      conversationId,
      user.id
    );
    if (!conv)
      return {
        data: null,
        error: { message: "Conversation not found or access denied." },
      };

    const { error } = await supabase
      .from("conversation_tags")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("tag_id", tagId);

    if (error) return { data: null, error: { message: error.message } };
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function updateConversationStatus(
  conversationId: string,
  status: "open" | "pending" | "closed"
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const conv = await verifyConversationMembership(
      supabase,
      conversationId,
      user.id
    );
    if (!conv)
      return {
        data: null,
        error: { message: "Conversation not found or access denied." },
      };

    const { error } = await supabase
      .from("conversations")
      .update({ status })
      .eq("id", conversationId);

    if (error) return { data: null, error: { message: error.message } };
    return { data: null, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function uploadAttachment(
  messageId: string,
  file: File
): Promise<ActionResult<Attachment>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data: message } = await supabase
      .from("messages")
      .select("conversation_id")
      .eq("id", messageId)
      .single();

    if (!message)
      return { data: null, error: { message: "Message not found." } };

    const conv = await verifyConversationMembership(
      supabase,
      message.conversation_id,
      user.id
    );
    if (!conv) return { data: null, error: { message: "Access denied." } };

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${messageId}/${Date.now()}-${sanitizedName}`;
    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(filePath, file);

    if (uploadError) return { data: null, error: { message: uploadError.message } };

    const { data: attachment, error } = await supabase
      .from("attachments")
      .insert({
        message_id: messageId,
        file_url: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) return { data: null, error: { message: error.message } };
    return { data: attachment, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}

export async function getSignedUrl(
  filePath: string
): Promise<ActionResult<string>> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const messageId = filePath.split("/")[0];
    if (!messageId)
      return { data: null, error: { message: "Invalid file path." } };

    const { data: message } = await supabase
      .from("messages")
      .select("conversation_id")
      .eq("id", messageId)
      .single();

    if (!message)
      return { data: null, error: { message: "Message not found." } };

    const conv = await verifyConversationMembership(
      supabase,
      message.conversation_id,
      user.id
    );
    if (!conv) return { data: null, error: { message: "Access denied." } };

    const { data, error } = await supabase.storage
      .from("message-attachments")
      .createSignedUrl(filePath, 3600);

    if (error) return { data: null, error: { message: error.message } };
    return { data: data.signedUrl, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Unknown error" },
    };
  }
}
