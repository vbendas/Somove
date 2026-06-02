import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import SessionPlayer from "./session-player";

export const dynamic = "force-dynamic";

export default async function SessionVideoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, client_id, therapist_id, mirotalk_room_url, status")
    .eq("id", params.id)
    .single();

  if (!session) notFound();

  let role: "client" | "therapist";

  if (session.therapist_id === user.id) {
    role = "therapist";
  } else if (session.client_id === user.id) {
    role = "client";
  } else {
    notFound();
  }

  const { getSessionJoinUrl } = await import("@/app/actions/session");
  const joinResult = await getSessionJoinUrl(params.id, user.id, role);

  if ("error" in joinResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-warm-gray">{joinResult.error}</p>
          <a
            href={role === "client" ? "/my-sessions" : "/dashboard"}
            className="mt-4 inline-block text-primary underline"
          >
            {role === "client" ? "Back to sessions" : "Back to dashboard"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <SessionPlayer
      joinUrl={joinResult.joinUrl}
      sessionId={params.id}
      role={role}
    />
  );
}
