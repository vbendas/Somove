import { TherapistNav } from "@/components/nav/therapist-nav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TherapistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData && userData.role !== "therapist" && userData.role !== "admin") {
      redirect("/");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded">
        Skip to content
      </a>
      <main id="main-content" className="pb-16">{children}</main>
      <TherapistNav />
    </div>
  );
}
