import { getSettingsContext } from "../data";
import { PricingForm } from "./pricing-form";

export const dynamic = "force-dynamic";

export default async function PricingSettingsPage() {
  const { profile } = await getSettingsContext();

  return (
    <PricingForm
      initial={{
        sessionPrice: String((profile?.session_price_cents || 0) / 100),
        sessionDuration: String(profile?.default_session_duration ?? 60),
        freeFirst: profile?.free_first_session ?? false,
      }}
    />
  );
}
