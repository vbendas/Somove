import { createAdminClient } from "@/lib/supabase/admin";

export interface PlatformSettings {
  id: number;
  platform_name: string;
  platform_tagline: string | null;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  background_color: string;
  open_registration: boolean;
  require_therapist_approval: boolean;
  support_email: string;
  smtp_host: string | null;
  smtp_port: number;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from_email: string | null;
  smtp_from_name: string | null;
  smtp_enabled: boolean;
  default_video_provider: string;
  platform_fee_percent: number;
  min_session_price_cents: number;
  max_session_price_cents: number;
  terms_of_service: string | null;
  privacy_policy: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  id: 1,
  platform_name: "Somove",
  platform_tagline: "Professional Session Platform",
  logo_url: null,
  primary_color: "#D4A574",
  accent_color: "#8BA888",
  background_color: "#FFFDF5",
  open_registration: true,
  require_therapist_approval: false,
  support_email: "support@localhost",
  smtp_host: null,
  smtp_port: 587,
  smtp_user: null,
  smtp_password: null,
  smtp_from_email: null,
  smtp_from_name: null,
  smtp_enabled: false,
  default_video_provider: "daily",
  platform_fee_percent: 10,
  min_session_price_cents: 5000,
  max_session_price_cents: 200000,
  terms_of_service: null,
  privacy_policy: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

let cachedSettings: PlatformSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function getPlatformSettings(): Promise<PlatformSettings> {
  // Return cached if fresh
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    cachedSettings = data as PlatformSettings;
    cacheTimestamp = Date.now();
    return cachedSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function isSetupCompleted(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("setup_completed")
      .eq("setup_completed", true)
      .limit(1)
      .maybeSingle();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

export async function getAdminUser(): Promise<{ id: string; email: string } | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getTherapistCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "therapist");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getClientCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "client");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getSessionCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}
