import type { VideoProvider, VideoProviderName } from "./types";

let _mirotalkProvider: VideoProvider | null = null;
let _dailyProvider: VideoProvider | null = null;

async function getMiroTalkProvider(): Promise<VideoProvider | null> {
  if (_mirotalkProvider) return _mirotalkProvider;

  const url = process.env.MIROTALK_URL;
  const apiKey = process.env.MIROTALK_API_KEY;
  if (!url || !apiKey) return null;

  const { createMiroTalkProvider } = await import("./mirotalk");
  _mirotalkProvider = createMiroTalkProvider({ url, apiKey });
  return _mirotalkProvider;
}

async function getDailyProvider(): Promise<VideoProvider | null> {
  if (_dailyProvider) return _dailyProvider;

  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return null;

  const domain = process.env.DAILY_DOMAIN;
  const { createDailyProvider } = await import("./daily");
  _dailyProvider = createDailyProvider({ apiKey, domain });
  return _dailyProvider;
}

export async function getVideoProvider(
  therapistId?: string
): Promise<VideoProvider | null> {
  if (therapistId) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("therapist_profile")
      .select("video_provider")
      .eq("user_id", therapistId)
      .single();

    const providerName = (profile?.video_provider as VideoProviderName) || "daily";

    if (providerName === "mirotalk") {
      return getMiroTalkProvider();
    }
    return getDailyProvider();
  }

  return (await getDailyProvider()) || (await getMiroTalkProvider());
}
