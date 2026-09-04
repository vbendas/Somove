import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// DEMO-ONLY LOGIN BYPASS.
// When DEMO_MODE=true the middleware sends every visitor here so they are
// automatically signed in as the demo account for the section they opened
// (client / therapist / admin) — no magic-link email required.
//
// This mints a real Supabase session, so RLS and all page logic behave
// exactly as for a normal user. It is a hard no-op unless DEMO_MODE=true.
// Remove the env var (or this file) once the demo is over.

const ROLES = ["client", "therapist", "admin"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string | null): value is Role {
  return !!value && (ROLES as readonly string[]).includes(value);
}

function safeNext(value: string | null): string {
  // Only allow same-origin relative paths to avoid open redirects.
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Demo mode is disabled" }, { status: 403 });
  }

  const { searchParams, origin } = new URL(request.url);
  const role = searchParams.get("role");
  const next = safeNext(searchParams.get("next"));
  if (!isRole(role)) {
    return NextResponse.json({ error: "Invalid ?role= (client|therapist|admin)" }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pick the demo account: the oldest user with the requested role.
  const { data: demoUser, error: userError } = await admin
    .from("users")
    .select("id")
    .eq("role", role)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (userError || !demoUser) {
    return NextResponse.json(
      { error: `No demo user with role "${role}" exists` },
      { status: 404 }
    );
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(demoUser.id);
  if (authError || !authUser.user?.email) {
    return NextResponse.json({ error: authError?.message ?? "Auth user not found" }, { status: 500 });
  }
  const email = authUser.user.email;

  const tempPassword = crypto.randomBytes(24).toString("base64url");
  const { error: updateError } = await admin.auth.admin.updateUserById(demoUser.id, {
    password: tempPassword,
  });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const cookieStore = await cookies();
  const cookieJar: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieJar.push({ name, value, options });
          });
        },
      },
    }
  );

  // Drop any existing session first so switching roles is clean.
  await supabase.auth.signOut({ scope: "local" });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: tempPassword,
  });
  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 500 });
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  cookieJar.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
