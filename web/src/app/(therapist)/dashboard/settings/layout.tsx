import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsNav } from "./settings-nav";
import { getSettingsContext } from "./data";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetches (and gates on) the user + therapist_profile row once per
  // request; individual tab pages call the same cached function to read
  // their slice without triggering a second query.
  await getSettingsContext();

  return (
    <PageContainer width="narrow">
      <PageHeader title="Settings" actions={<ThemeToggle />} />
      <SettingsNav />
      <div className="mt-6">{children}</div>
    </PageContainer>
  );
}
