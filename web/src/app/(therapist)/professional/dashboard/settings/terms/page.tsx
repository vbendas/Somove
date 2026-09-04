import { getSettingsContext } from "../data";
import { TermsForm } from "./terms-form";

export const dynamic = "force-dynamic";

export default async function TermsSettingsPage() {
  const { profile } = await getSettingsContext();

  return (
    <TermsForm
      initial={{
        tosText: profile?.tos_text || "",
        tosVersion: profile?.tos_version || 1,
      }}
    />
  );
}
