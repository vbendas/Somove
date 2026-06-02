import { ClientNav } from "@/components/nav/client-nav";
import PoweredByFooter from "@/components/layout/powered-by-footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">{children}</main>
      <PoweredByFooter />
      <ClientNav />
    </div>
  );
}
