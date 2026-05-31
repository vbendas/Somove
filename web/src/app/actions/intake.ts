"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveIntake(intakeData: {
  reasons: string[];
  previousExperience: string;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { data: existing } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("client_profiles")
      .update({ intake_data: intakeData })
      .eq("id", existing.id);
  } else {
    const { data: therapists } = await supabase
      .from("therapist_profile")
      .select("user_id")
      .limit(1);

    if (therapists && therapists.length > 0) {
      await supabase.from("client_profiles").insert({
        user_id: user.id,
        therapist_id: therapists[0].user_id,
        intake_data: intakeData,
      });
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function skipIntake() {
  revalidatePath("/", "layout");
  redirect("/");
}
