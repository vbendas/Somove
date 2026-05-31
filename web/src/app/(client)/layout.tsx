import { ClientNav } from "@/components/nav/client-nav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">{children}</main>
      <ClientNav />
    </div>
  );
}
