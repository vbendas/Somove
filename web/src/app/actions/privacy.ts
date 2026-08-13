"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function exportMyData(): Promise<{
  data?: string;
  filename?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  const [profile, sessions, messages, notes, payments, attachments] =
    await Promise.all([
      admin.from("users").select("*").eq("id", user.id).single(),
      admin
        .from("sessions")
        .select("*")
        .or(`client_id.eq.${user.id},therapist_id.eq.${user.id}`),
      admin.from("messages").select("*").eq("sender_id", user.id),
      admin
        .from("client_notes")
        .select("*")
        .or(`client_id.eq.${user.id},therapist_id.eq.${user.id}`),
      admin.from("payments").select("*").eq("client_id", user.id),
      admin.from("attachments").select("*").eq("uploader_id", user.id),
    ]);

  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      sessions: sessions.data,
      messages: messages.data,
      notes: notes.data,
      payments: payments.data,
      attachments: attachments.data,
    },
    null,
    2
  );

  await logAudit(user.id, "data_export", "user", user.id);

  return {
    data: payload,
    filename: `somove-export-${user.id.slice(0, 8)}-${Date.now()}.json`,
  };
}

export async function deleteMyAccount(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  try {
    const { data: userMessages } = await admin
      .from("messages")
      .select("id")
      .eq("sender_id", user.id);

    if (userMessages && userMessages.length > 0) {
      const messageIds = userMessages.map((m) => m.id);
      const { data: userAttachments } = await admin
        .from("attachments")
        .select("file_path")
        .in("message_id", messageIds);

      if (userAttachments) {
        for (const att of userAttachments) {
          if (att.file_path) {
            await admin.storage
              .from("attachments")
              .remove([att.file_path])
              .catch(() => {});
          }
        }
      }
    }

    const { error: authError } = await admin.auth.admin.deleteUser(user.id);
    if (authError) return { error: `Failed to delete account: ${authError.message}` };

    await admin.from("users").delete().eq("id", user.id);

    await logAudit(user.id, "account_deletion", "user", user.id);
  } catch {
    return { error: "Failed to delete account. Please contact support." };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}