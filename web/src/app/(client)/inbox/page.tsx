import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Inbox
        </h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-warm-gray">
              Messaging coming in Phase 4 (Supabase Realtime chat)
            </p>
            <Link href="/">
              <Button variant="outline">Browse Therapists</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
