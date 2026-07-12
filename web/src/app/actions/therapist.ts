"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createTherapistProfile(profile: {
  bio: string;
  credentials: string[];
  modalities: string[];
  session_price_cents: number;
  default_session_duration: number;
  free_first_session: boolean;
  cal_api_key?: string;
  cal_event_type_id?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // Therapist onboarding is only for users who already hold the therapist
  // role (set by acceptInvite() or an admin action via the service-role
  // client) or who have an accepted, non-expired therapist invite on file.
  // This blocks arbitrary signed-up users from self-promoting to therapist.
  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userRow?.role !== "therapist") {
    const adminClient = createAdminClient();
    const { data: invite } = await adminClient
      .from("invites")
      .select("id, expires_at, accepted_at")
      .eq("email", user.email!)
      .eq("role", "therapist")
      .not("accepted_at", "is", null)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!invite) {
      return { error: "Therapist onboarding requires an invitation." };
    }
  }

  const defaultAvailability = {
    weekly: {
      monday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
      tuesday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
      wednesday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
      thursday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
      friday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    },
    overrides: {},
    bufferMinutes: 15,
    timezone: "Europe/Lisbon",
  };

  // Upsert: acceptInvite() may have already created a bare profile row.
  const { error } = await supabase.from("therapist_profile").upsert(
    {
      user_id: user.id,
      bio: profile.bio,
      credentials: profile.credentials,
      modalities: profile.modalities,
      session_price_cents: profile.session_price_cents,
      default_session_duration: profile.default_session_duration,
      free_first_session: profile.free_first_session,
      availability_rules: defaultAvailability,
      timezone: "Europe/Lisbon",
      cal_api_key: profile.cal_api_key || null,
      cal_event_type_id: profile.cal_event_type_id || null,
      status: "active",
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  // Role is only ever set by acceptInvite()/admin actions via the
  // service-role client — never self-assigned here (see migration
  // 00026_role_escalation_guard.sql).

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function getTherapistProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function getAllTherapists() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("status", "active");

  if (error) return [];
  return data;
}

export async function getTherapistById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("user_id", id)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data;
}
