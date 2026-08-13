import { createClient } from "@/lib/supabase/server";

export function getCurrentTermsVersion(): string {
  return process.env.TERMS_VERSION || "v1";
}

export async function hasAcceptedTerms(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const version = getCurrentTermsVersion();
  const { data } = await supabase
    .from("terms_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("version", version)
    .maybeSingle();
  return !!data;
}

export async function recordTermsAcceptance(userId: string): Promise<void> {
  const supabase = await createClient();
  const version = getCurrentTermsVersion();
  await supabase.from("terms_acceptances").insert({
    user_id: userId,
    version,
  });
}