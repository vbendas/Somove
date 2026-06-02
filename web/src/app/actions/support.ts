"use server";

import { createClient } from "@/lib/supabase/server";
import { getChatwootClient } from "@/lib/chatwoot";

interface ActionResult<T = void> {
  data: T | null;
  error: { message: string } | null;
}

export async function createSupportTicket(input: {
  category: string;
  subject: string;
  description: string;
  priority: string;
}): Promise<ActionResult<{ ticketId: string }>> {
  const chatwoot = getChatwootClient();
  if (!chatwoot) return { data: null, error: { message: "Support system not configured" } };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: "Not authenticated" } };

  const { data: userProfile } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("id", user.id)
    .single();

  const contactResult = await chatwoot.createContact(
    userProfile?.name || user.email?.split("@")[0] || "User",
    user.email || "",
    user.id
  );

  if (contactResult.error) {
    return { data: null, error: contactResult.error };
  }

  const inboxId = userProfile?.role === "therapist" ? 2 : 1;
  const convResult = await chatwoot.createConversation(
    contactResult.data!.id,
    inboxId
  );

  if (convResult.error) {
    return { data: null, error: convResult.error };
  }

  const message = `[${input.priority.toUpperCase()}] ${input.category}: ${input.subject}\n\n${input.description}`;
  const msgResult = await chatwoot.sendMessage(convResult.data!.id, message);

  if (msgResult.error) {
    return { data: null, error: msgResult.error };
  }

  return { data: { ticketId: String(convResult.data!.id) }, error: null };
}

export async function getUserTickets(): Promise<
  ActionResult<Array<{ id: string; status: string; subject: string; createdAt: string }>>
> {
  const chatwoot = getChatwootClient();
  if (!chatwoot) return { data: null, error: { message: "Support system not configured" } };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: "Not authenticated" } };

  const contactResult = await chatwoot.createContact(
    user.email?.split("@")[0] || "User",
    user.email || "",
    user.id
  );

  if (contactResult.error || !contactResult.data) {
    return { data: null, error: contactResult.error || { message: "Failed to find contact" } };
  }

  const convResult = await chatwoot.getContactConversations(contactResult.data.id);

  if (convResult.error || !convResult.data) {
    return { data: null, error: convResult.error || { message: "Failed to load tickets" } };
  }

  const tickets = convResult.data.payload.map((c) => ({
    id: String(c.id),
    status: c.status,
    subject: `Ticket #${c.id}`,
    createdAt: new Date().toISOString(),
  }));

  return { data: tickets, error: null };
}
