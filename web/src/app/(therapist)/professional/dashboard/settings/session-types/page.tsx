import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SessionTypesManager } from "./session-types-manager";

export const dynamic = "force-dynamic";

export default async function SessionTypesSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: types } = await supabase
    .from("session_types")
    .select("*")
    .eq("therapist_id", user.id)
    .order("created_at", { ascending: true });

  return <SessionTypesManager initial={types || []} />;
}
