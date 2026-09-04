import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type TherapistProfileRow = Database["public"]["Tables"]["therapist_profile"]["Row"];

/**
 * Fetches the current user and their therapist_profile row once per request.
 * Wrapped in React `cache()` so the layout and every tab's page.tsx can call
 * this independently without re-querying Supabase for the same data.
 */
export const getSettingsContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("therapist_profile")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { user, profile: profile as TherapistProfileRow | null };
});
