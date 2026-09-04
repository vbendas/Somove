import { getSettingsContext } from "../data";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const { profile } = await getSettingsContext();

  return <ProfileForm initial={{ bio: profile?.bio || "" }} />;
}
