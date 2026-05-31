import { TherapistNav } from "@/components/nav/therapist-nav";

export default function TherapistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">{children}</main>
      <TherapistNav />
    </div>
  );
}
