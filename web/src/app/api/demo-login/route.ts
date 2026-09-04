import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient, type Session } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// DEMO-ONLY LOGIN BYPASS.
// When DEMO_MODE=true the middleware sends every visitor here so they are
// automatically signed in as the demo account for the section they opened
// (client / therapist / admin) — no magic-link email required.
//
// A real Supabase session is minted once per role (via a one-time
// magic-link token that is verified immediately and never emailed) and then
// cached in this server instance for ~50 minutes. Every visitor of that role
// receives the cached session, so concurrent requests (link prefetches, a
// group of people opening the demo at once) do not hammer Supabase Auth or
// race each other. If a shared session is ever invalidated, the middleware
// simply sends the visitor back here and a fresh one is minted.
//
// Hard no-op unless DEMO_MODE=true. Remove the env var (or this file) once
// the demo is over.

const ROLES = ["client", "therapist", "admin"] as const;
type Role = (typeof ROLES)[number];

const SESSION_TTL_MS = 50 * 60 * 1000; // access tokens live 60 min

type CachedSession = { session: Session; expiresAt: number };
const sessionCache = new Map<Role, CachedSession>();
const inFlight = new Map<Role, Promise<Session>>();

function isRole(value: string | null): value is Role {
  return !!value && (ROLES as readonly string[]).includes(value);
}

function safeNext(value: string | null): string {
  // Only allow same-origin relative paths to avoid open redirects.
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function demoDisabled() {
  return NextResponse.json({ error: "Demo mode is disabled" }, { status: 403 });
}

async function mintSession(role: Role): Promise<Session> {
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
    throw new Error(`No demo user with role "${role}" exists`);
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(demoUser.id);
  if (authError || !authUser.user?.email) {
    throw new Error(authError?.message ?? "Auth user not found");
  }

  // One-time token, never emailed.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.user.email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    throw new Error(linkError?.message ?? "Could not create token");
  }

  // Verify with a plain (cookie-less) client so we get the raw session back.
  const anon = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  const { data, error: verifyError } = await anon.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  if (verifyError || !data.session) {
    throw new Error(verifyError?.message ?? "Could not verify token");
  }
  return data.session;
}

async function getSession(role: Role): Promise<Session> {
  const cached = sessionCache.get(role);
  if (cached && cached.expiresAt > Date.now()) return cached.session;

  // Coalesce concurrent misses into a single mint per role.
  let pending = inFlight.get(role);
  if (!pending) {
    pending = mintSession(role)
      .then((session) => {
        sessionCache.set(role, { session, expiresAt: Date.now() + SESSION_TTL_MS });
        return session;
      })
      .finally(() => inFlight.delete(role));
    inFlight.set(role, pending);
  }
  return pending;
}

export async function GET(request: Request) {
  if (process.env.DEMO_MODE !== "true") return demoDisabled();

  const { searchParams, origin } = new URL(request.url);
  const role = searchParams.get("role");
  const next = safeNext(searchParams.get("next"));
  if (!isRole(role)) {
    return NextResponse.json({ error: "Invalid ?role= (client|therapist|admin)" }, { status: 400 });
  }

  let session: Session;
  try {
    session = await getSession(role);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create demo session" },
      { status: 500 }
    );
  }

  // Write the session into the visitor's auth cookies.
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
  const { error: setError } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (setError) {
    // The cached session went bad (e.g. refresh token rotated elsewhere).
    // Drop it so the next visitor mints a fresh one.
    sessionCache.delete(role);
    return NextResponse.json({ error: setError.message }, { status: 500 });
  }

  const response = NextResponse.redirect(`${origin}${next}`, 303);
  cookieJar.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

// Safety net: if a Server Action POST ever lands here (the browser's
// document URL can transiently be this route during the redirect chain),
// bounce the browser back to the target page instead of returning 405.
export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== "true") return demoDisabled();
  const { searchParams, origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}${safeNext(searchParams.get("next"))}`, 303);
}
