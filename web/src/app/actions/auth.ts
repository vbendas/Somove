"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { limiters, getClientIp, checkLimit } from "@/lib/ratelimit";
import { recordTermsAcceptance } from "@/lib/terms";

export async function signInWithMagicLink(email: string) {
  const ip = await getClientIp();
  const [ipOk, emailOk] = await Promise.all([
    checkLimit(limiters.magicLinkIp, ip),
    checkLimit(limiters.magicLink, email.toLowerCase()),
  ]);
  if (!ipOk.ok || !emailOk.ok) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = await createClient();

  // Check if registration is open (allow existing users always)
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!existingUser) {
    // New user — check if registration is open
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("open_registration")
      .eq("id", 1)
      .single();

    if (settings && !settings.open_registration) {
      return {
        error:
          "Registration is currently closed. Please contact the platform administrator for an invitation.",
      };
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateUserName(name: string, acceptedTerms: boolean = false) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in again." };
  }

  if (!acceptedTerms) {
    return { error: "You must accept the Terms of Service and Privacy Policy to continue." };
  }

  await recordTermsAcceptance(user.id);

  const { error: updateError } = await supabase
    .from("users")
    .update({ name })
    .eq("id", user.id);

  if (updateError) {
    return { error: `Update failed: ${updateError.message}` };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return userData;
}
