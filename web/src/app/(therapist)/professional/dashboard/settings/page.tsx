import { redirect } from "next/navigation";

export default function SettingsIndex() {
  redirect("/professional/dashboard/settings/profile");
}
