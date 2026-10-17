import { createAdminClient } from "@/lib/supabase/admin";

export async function getTherapists() {
  const admin = createAdminClient();

  const { data: profiles, error: profileError } = await admin
    .from("therapist_profile")
    .select("*")
    .eq("status", "active");

  if (profileError) {
    console.error("getTherapists profile query error:", profileError.message);
    return [];
  }

  if (!profiles || profiles.length === 0) return [];

  const userIds = profiles.map((p) => p.user_id);
  const { data: users } = await admin
    .from("users")
    .select("id, name, email")
    .in("id", userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  return profiles.map((p) => ({
    ...p,
    users: userMap.get(p.user_id) || null,
  }));
}
