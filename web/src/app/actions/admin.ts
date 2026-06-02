"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AdminStats {
  therapistCount: number;
  clientCount: number;
  sessionCount: number;
  totalRevenue: number;
  pendingInvites: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();

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

export async function getTherapists() {
  try {
    const supabase = createClient();

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
      .order("created_at", { ascending: false });

    if (error) return { therapists: [] };

    const normalized = (data ?? []).map((t: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      created_at: string;
      therapist_profile: { status: string; session_price_cents: number | null; video_provider: string }[] | null;
    }) => ({
      id: t.id,
      email: t.email,
      name: t.name,
      role: t.role,
      created_at: t.created_at,
      therapist_profile: t.therapist_profile?.[0] ?? null,
    }));

    return { therapists: normalized };
  } catch (e) {
    console.error("getTherapists error:", e);
    return { therapists: [] };
  }
}

export async function updateTherapistStatus(therapistId: string, status: string) {
  const supabase = createClient();

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

export async function deleteUser(userId: string) {
  const supabase = createClient();

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

  // Delete from users table (cascading should handle related data)
  const { error: dbError } = await adminClient
    .from("users")
    .delete()
    .eq("id", userId);

  if (dbError) return { error: `Failed to delete user record: ${dbError.message}` };

  revalidatePath("/admin/dashboard", "page");
  return { success: true };
}
