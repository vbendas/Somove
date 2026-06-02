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
        "*, client:users!conversations_client_id_fkey(id, name, email)"
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

    const enriched: ConversationWithDetails[] = [];

    for (const conv of conversations || []) {
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

      let tags: Tag[] = [];
      const { data: tagLinks } = await supabase
        .from("conversation_tags")
        .select("tag_id")
        .eq("conversation_id", conv.id);

      if (tagLinks && tagLinks.length > 0) {
        const tagIds = tagLinks.map((t) => t.tag_id);
        const { data: tagData } = await supabase
          .from("tags")
          .select("*")
          .in("id", tagIds);
        tags = tagData || [];
      }

      enriched.push({
        ...conv,
        lastMessage: lastMsg
          ? { body: lastMsg.content, sent_at: lastMsg.sent_at, sender_id: lastMsg.sender_id }
          : null,
        tags,
        unreadCount: unreadCount || 0,
      });
    }

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

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("sent_at", { ascending: true });

    if (error) return { data: null, error: { message: error.message } };

    const enriched: MessageWithAttachments[] = [];

    for (const msg of messages || []) {
      const { data: attachments } = await supabase
        .from("attachments")
        .select("*")
        .eq("message_id", msg.id);

      enriched.push({
        ...msg,
        attachments: attachments || [],
      });
    }

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

    const filePath = `${messageId}/${Date.now()}-${file.name}`;
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
