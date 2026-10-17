"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { DEMO_DISABLED_MESSAGE, demoGuard, isDemoMode, maskEmail } from "@/lib/demo";

type TherapistProfileRow = { status: string; session_price_cents: number | null; video_provider: string };

export interface AdminStats {
  therapistCount: number;
  clientCount: number;
  sessionCount: number;
  totalRevenue: number;
  pendingInvites: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { therapistCount: 0, clientCount: 0, sessionCount: 0, totalRevenue: 0, pendingInvites: 0 };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return { therapistCount: 0, clientCount: 0, sessionCount: 0, totalRevenue: 0, pendingInvites: 0 };
  }

  const adminClient = createAdminClient();

  const [therapistCount, clientCount, sessionCount, revenueResult, pendingInvites] = await Promise.all([
    adminClient.from("users").select("*", { count: "exact", head: true }).eq("role", "therapist"),
    adminClient.from("users").select("*", { count: "exact", head: true }).eq("role", "client"),
    adminClient.from("sessions").select("*", { count: "exact", head: true }),
    adminClient.from("payments").select("platform_fee_cents").eq("status", "completed"),
    adminClient.from("invites").select("*", { count: "exact", head: true }).is("accepted_at", null).gt("expires_at", new Date().toISOString()),
  ]);

  const totalRevenue = (revenueResult.data ?? []).reduce(
    (sum, p) => sum + (p.platform_fee_cents || 0),
    0
  );

  return {
    therapistCount: therapistCount.count ?? 0,
    clientCount: clientCount.count ?? 0,
    sessionCount: sessionCount.count ?? 0,
    totalRevenue,
    pendingInvites: pendingInvites.count ?? 0,
  };
}

export async function getTherapists(limit: number = 50, offset: number = 0) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { therapists: [] };

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") return { therapists: [] };

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("users")
      .select(`
        id,
        email,
        name,
        role,
        created_at,
        therapist_profile (
          status,
          session_price_cents,
          video_provider
        )
      `)
      .eq("role", "therapist")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { therapists: [] };

    const normalized = (data ?? []).map((t: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      created_at: string;
      therapist_profile: TherapistProfileRow | TherapistProfileRow[] | null;
    }) => ({
      id: t.id,
      email: isDemoMode() ? maskEmail(t.email) : t.email,
      name: t.name,
      role: t.role,
      created_at: t.created_at,
      // One-to-one (user_id UNIQUE): PostgREST returns an object, not an array.
      therapist_profile: Array.isArray(t.therapist_profile)
        ? (t.therapist_profile[0] ?? null)
        : (t.therapist_profile ?? null),
    }));

    return { therapists: normalized, demo: isDemoMode() };
  } catch (e) {
    console.error("getTherapists error:", e);
    return { therapists: [] };
  }
}

export async function updateTherapistStatus(therapistId: string, status: string) {
  const blocked = demoGuard();
  if (blocked) return { error: blocked.error };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return { error: "Only admins can update therapist status." };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("therapist_profile")
    .update({ status })
    .eq("user_id", therapistId);

  if (error) return { error: `Failed to update status: ${error.message}` };

  revalidatePath("/admin/dashboard", "page");
  return { success: true };
}

export async function createTherapistProfileForUser(therapistId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return { error: "Only admins can create profiles." };

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from("therapist_profile")
    .select("id")
    .eq("user_id", therapistId)
    .limit(1)
    .maybeSingle();

  if (existing) return { error: "Profile already exists." };

  const defaultAvailability = {
    weekly: {
      monday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      thursday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      friday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    },
    overrides: {},
    bufferMinutes: 15,
    timezone: "Europe/Lisbon",
  };

  const { error } = await adminClient.from("therapist_profile").insert({
    user_id: therapistId,
    bio: "",
    credentials: [],
    modalities: [],
    session_price_cents: 9000,
    default_session_duration: 60,
    free_first_session: false,
    availability_rules: defaultAvailability,
    status: "active",
  });

  if (error) return { error: `Failed to create profile: ${error.message}` };

  revalidatePath("/admin/therapists", "page");
  return { success: true };
}

export async function deleteUser(userId: string) {
  if (isDemoMode()) return { error: DEMO_DISABLED_MESSAGE };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return { error: "Only admins can delete users." };

  const adminClient = createAdminClient();

  // Delete user from auth
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  if (authError) return { error: `Failed to delete user: ${authError.message}` };

  // Clean up Storage attachments owned by this user
  const { data: userMessages } = await adminClient
    .from("messages")
    .select("id")
    .eq("sender_id", userId);
  if (userMessages && userMessages.length > 0) {
    const messageIds = userMessages.map((m) => m.id);
    const { data: userAttachments } = await adminClient
      .from("attachments")
      .select("file_path")
      .in("message_id", messageIds);
    if (userAttachments) {
      for (const att of userAttachments) {
        if (att.file_path) {
          await adminClient.storage
            .from("attachments")
            .remove([att.file_path])
            .catch(() => {});
        }
      }
    }
  }

  // Delete from users table (cascading should handle related data)
  const { error: dbError } = await adminClient
    .from("users")
    .delete()
    .eq("id", userId);

  if (dbError) return { error: `Failed to delete user record: ${dbError.message}` };

  await logAudit(user.id, "admin_user_deletion", "user", userId);

  revalidatePath("/admin/dashboard", "page");
  return { success: true };
}
