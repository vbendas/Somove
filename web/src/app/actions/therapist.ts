"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
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

  const { error } = await supabase.from("therapist_profile").insert({
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
  });

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("users")
    .update({ role: "therapist" })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function getTherapistProfile(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function getAllTherapists() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("status", "active");

  if (error) return [];
  return data;
}

export async function getTherapistById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("user_id", id)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data;
}
