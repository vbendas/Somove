import { AdminNav } from "@/components/nav/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded">
        Skip to content
      </a>
      <AdminNav demoMode={demoMode} />

      <main id="main-content">{children}</main>
    </div>
  );
}
