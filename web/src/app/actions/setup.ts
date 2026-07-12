"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlatformSettings as fetchPlatformSettings, invalidateSettingsCache, type PlatformSettings } from "@/lib/platform";

export async function getPlatformSettings(): Promise<PlatformSettings> {
  return fetchPlatformSettings();
}

export async function checkSetupStatus() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("setup_completed", true)
    .limit(1)
    .maybeSingle();

  if (error) return { setupComplete: false };
  return { setupComplete: !!data };
}

export async function completeSetup(formData: {
  platformName: string;
  platformTagline?: string;
  primaryColor?: string;
  accentColor?: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  openRegistration?: boolean;
  bootstrapToken: string;
}) {
  // Verify bootstrap token
  if (formData.bootstrapToken !== process.env.SETUP_BOOTSTRAP_TOKEN) {
    return { error: "Invalid setup token." };
  }

  const supabase = createAdminClient();

  // 1. Check if setup is already complete
  const { data: existingAdmin } = await supabase
    .from("users")
    .select("id")
    .eq("setup_completed", true)
    .limit(1)
    .maybeSingle();

  if (existingAdmin) {
    return { error: "Setup has already been completed." };
  }

  // 2. Create admin user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: formData.adminEmail,
    password: formData.adminPassword,
    email_confirm: true,
  });

  if (authError) {
    return { error: `Failed to create admin user: ${authError.message}` };
  }

  // 3. Update the user record in our users table
  const { error: updateError } = await supabase
    .from("users")
    .update({
      name: formData.adminName,
      role: "admin",
      setup_completed: true,
    })
    .eq("id", authData.user.id);

  if (updateError) {
    return { error: `Failed to update admin profile: ${updateError.message}` };
  }

  // 4. Update platform settings
  const { error: settingsError } = await supabase
    .from("platform_settings")
    .upsert({
      id: 1,
      platform_name: formData.platformName,
      platform_tagline: formData.platformTagline || null,
      primary_color: formData.primaryColor || "#D4A574",
      accent_color: formData.accentColor || "#8BA888",
      open_registration: formData.openRegistration ?? true,
      updated_at: new Date().toISOString(),
    });

  if (settingsError) {
    return { error: `Failed to update platform settings: ${settingsError.message}` };
  }

  invalidateSettingsCache();
  revalidatePath("/", "layout");

  return { success: true };
}

export async function updatePlatformSettings(settings: {
  platform_name?: string;
  platform_tagline?: string;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  open_registration?: boolean;
  require_therapist_approval?: boolean;
  support_email?: string;
  default_video_provider?: string;
  platform_fee_percent?: number;
  terms_of_service?: string;
  privacy_policy?: string;
}) {
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

  if (userData?.role !== "admin") {
    return { error: "Admin access required." };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("platform_settings")
    .upsert({
      id: 1,
      ...settings,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { error: `Failed to update settings: ${error.message}` };
  }

  invalidateSettingsCache();
  revalidatePath("/", "layout");

  return { success: true };
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format");

const platformThemeSchema = z.object({
  primary_color: hexColor,
  accent_color: hexColor,
  background_color: hexColor,
  logo_url: z.string().nullable(),
});

export async function updatePlatformTheme(theme: {
  primary_color: string;
  accent_color: string;
  background_color: string;
  logo_url: string | null;
}): Promise<{ success?: true; error?: string }> {
  const parsed = platformThemeSchema.safeParse(theme);
  if (!parsed.success) {
    return { error: "Invalid color format" };
  }

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

  if (userData?.role !== "admin") {
    return { error: "Admin access required." };
  }

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("platform_settings")
    .upsert({
      id: 1,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    });

  if (updateError) {
    return { error: `Failed to update theme: ${updateError.message}` };
  }

  invalidateSettingsCache();
  revalidatePath("/", "layout");

  return { success: true };
}
