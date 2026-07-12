import { getSettingsContext } from "../data";
import { IntegrationsForm } from "./integrations-form";

export const dynamic = "force-dynamic";

export default async function IntegrationsSettingsPage() {
  const { profile } = await getSettingsContext();

  return (
    <IntegrationsForm
      initial={{
        calApiKey: profile?.cal_api_key || "",
        calEventTypeId: profile?.cal_event_type_id || "",
        mirotalkUrl: profile?.mirotalk_url || "",
        mirotalkKey: profile?.mirotalk_api_key || "",
        videoProvider: (profile?.video_provider as "daily" | "mirotalk") || "daily",
        dailyApiKey: profile?.daily_api_key || "",
        resendKey: profile?.resend_api_key || "",
      }}
    />
  );
}
