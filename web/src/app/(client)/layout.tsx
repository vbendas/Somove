import { ClientNav } from "@/components/nav/client-nav";
import { AppHeader } from "@/components/layout/app-header";
import PoweredByFooter from "@/components/layout/powered-by-footer";
import { createClient } from "@/lib/supabase/server";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded">
        Skip to content
      </a>
      <AppHeader area="client" userId={user?.id} demoMode={demoMode} />
      <main id="main-content" className="pb-16 pt-4 md:pb-8 md:pt-8">
        {children}
      </main>
      <PoweredByFooter />
      <ClientNav userId={user?.id} />
    </div>
  );
}
