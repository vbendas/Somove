"use server";

import { CalClient } from "@/lib/cal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getTherapistCalKey(userId: string) {
  const admin = createAdminClient();
  const { data: secrets } = await admin
    .from("therapist_secrets")
    .select("cal_api_key")
    .eq("user_id", userId)
    .single();
  return secrets?.cal_api_key || null;
}

export async function testCalConnection() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const apiKey = await getTherapistCalKey(user.id);
  if (!apiKey) return { error: "Cal.com API key not configured." };

  const calClient = new CalClient(apiKey);
  const result = await calClient.testConnection();
  return result;
}

export async function fetchCalEventTypes() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const apiKey = await getTherapistCalKey(user.id);
  if (!apiKey) return { error: "Cal.com API key not configured." };

  const calClient = new CalClient(apiKey);
  const result = await calClient.getEventTypes();
  return result;
}

export async function createCalEventType(data: {
  title: string;
  slug: string;
  lengthInMinutes: number;
  description?: string;
  minimumBookingNotice?: number;
  afterEventBuffer?: number;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const apiKey = await getTherapistCalKey(user.id);
  if (!apiKey) return { error: "Cal.com API key not configured." };

  const calClient = new CalClient(apiKey);
  const result = await calClient.createEventType({
    title: data.title,
    slug: data.slug,
    lengthInMinutes: data.lengthInMinutes,
    description: data.description,
    locations: [{ type: "integration", integration: "cal-video" }],
    minimumBookingNotice: data.minimumBookingNotice || 60,
    afterEventBuffer: data.afterEventBuffer || 15,
  });
  return result;
}

export async function saveCalIntegration(calApiKeyId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("therapist_profile")
    .update({ cal_api_key: calApiKeyId || null })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function disconnectCalIntegration() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("therapist_profile")
    .update({
      cal_api_key: null,
      cal_event_type_id: null,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getTherapistCalConfig() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("therapist_profile")
    .select("cal_api_key, cal_event_type_id")
    .eq("user_id", user.id)
    .single();

  return data;
}
