import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["pt", "en", "es", "fr", "de", "it", "nl", "pt-BR", "pt-PT"];
// eslint-disable-next-line security/detect-non-literal-regexp
const LOCALE_PATTERN = new RegExp(`^/(${SUPPORTED_LOCALES.join("|")})(?=/|$)`);

function stripLocale(pathname: string): string {
  return pathname.replace(LOCALE_PATTERN, "") || "/";
}

export async function middleware(request: NextRequest) {
  const { pathname: rawPathname } = request.nextUrl;
  const pathname = stripLocale(rawPathname);

  // Redirect locale-prefixed URLs to non-prefixed versions
  // (the app doesn't have [locale] routing — these are leftover URLs
  // from Supabase or bookmarks)
  if (rawPathname !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // The marketing page only exists to be served at "/" for unauthenticated
  // visitors (see the rewrite below) — direct hits on /landing always
  // canonicalize to "/", regardless of auth state.
  if (pathname === "/landing") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Index routes that only exist to forward to their first child. Doing this
  // here yields a real HTTP redirect; a `redirect()` inside a page.tsx that
  // sits under a loading.tsx Suspense boundary is streamed as a soft
  // client-side redirect instead, which trips Next's router ("Rendered more
  // hooks than during the previous render") right after an auth redirect.
  const INDEX_FORWARDS: Record<string, string> = {
    "/admin": "/admin/dashboard",
    "/professional/dashboard/settings": "/professional/dashboard/settings/profile",
  };
  if (INDEX_FORWARDS[pathname]) {
    return NextResponse.redirect(new URL(INDEX_FORWARDS[pathname], request.url));
  }

  // DEMO MODE (DEMO_MODE=true): no magic-link login. Visitors are signed in
  // automatically as the demo account for the section they open — see
  // src/app/api/demo-login/route.ts. /login is meaningless here.
  const DEMO_MODE = process.env.DEMO_MODE === "true";
  if (DEMO_MODE && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // In the demo "/" is always the public website, whoever is signed in.
  if (DEMO_MODE && pathname === "/") {
    return NextResponse.rewrite(new URL("/landing", request.url), { request });
  }

  const publicRoutes = [
    "/login",
    "/api/demo-login",
    "/auth/callback",
    "/complete-profile",
    "/onboarding",
    "/therapists",
    "/emergency",
    "/setup",
    "/invite",
    // TEMPORARY dev-only login bypass — see src/app/api/dev-login/route.ts.
    // Remove alongside that file once local login works normally again.
    "/api/dev-login",
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute && !pathname.startsWith("/therapists/")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (DEMO_MODE && !pathname.startsWith("/api/") && !pathname.startsWith("/auth/")) {
    // Which demo account does this section need?
    //   /admin/**                    → admin
    //   /professional/**, /onboarding → therapist
    //   everything else              → client
    const requiredRole =
      pathname.startsWith("/admin")
        ? "admin"
        : pathname.startsWith("/professional") || pathname === "/onboarding"
          ? "therapist"
          : "client";

    let currentRole: string | null = null;
    if (user) {
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
      currentRole = data?.role ?? null;
    }

    if (currentRole !== requiredRole) {
      // Never switch accounts inside a background fetch. Link prefetches and
      // client-side navigations are fetch() calls; following the demo-login
      // redirect from one would silently replace the session the page on
      // screen depends on. Next strips its own `Next-Router-Prefetch` header
      // and the `_rsc` query param before the middleware runs, so rely on
      // the browser's fetch-metadata headers instead: a real page load has
      // `Sec-Fetch-Dest: document`; fetch() calls have `empty`. Answering
      // with an empty non-RSC response makes the router skip the prefetch,
      // or fall back to a full-page navigation, which then signs in below.
      const fetchDest = request.headers.get("sec-fetch-dest");
      const isBackgroundFetch =
        (fetchDest !== null && fetchDest !== "document") ||
        request.headers.get("purpose") === "prefetch" ||
        request.headers.get("sec-purpose")?.includes("prefetch");
      if (isBackgroundFetch) {
        return new NextResponse(null, { status: 204 });
      }

      const target = request.nextUrl.clone();
      target.searchParams.delete("_rsc");
      const url = request.nextUrl.clone();
      url.pathname = "/api/demo-login";
      url.search = "";
      url.searchParams.set("role", requiredRole);
      url.searchParams.set("next", pathname + target.search);
      return NextResponse.redirect(url);
    }
  }

  if (!user && isPublicRoute) return supabaseResponse;

  if (!user) {
    // Unauthenticated visitors to "/" get the public marketing landing page
    // rendered in place (URL stays "/", no redirect flicker) instead of
    // being bounced to /login.
    if (pathname === "/") {
      const rewriteResponse = NextResponse.rewrite(new URL("/landing", request.url), { request });
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        rewriteResponse.cookies.set(cookie.name, cookie.value);
      });
      return rewriteResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  let userData: { role: string; name: string } | null = null;
  let hasTherapistProfile = false;

  try {
    const { data } = await supabase
      .from("users")
      .select("role, name")
      .eq("id", user.id)
      .single();
    userData = data;

    if (userData?.role === "therapist") {
      const { data: profile } = await supabase
        .from("therapist_profile")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      hasTherapistProfile = !!profile;
    }
  } catch {
    // If DB queries fail (migrations not applied, etc.),
    // let the request through — page-level auth will handle it
  }

  if (pathname === "/login") {
    if (userData?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (userData?.role === "therapist") {
      if (!hasTherapistProfile) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return NextResponse.redirect(new URL("/professional/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/complete-profile" && userData?.name) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!userData?.name && pathname !== "/complete-profile") {
    return NextResponse.redirect(new URL("/complete-profile", request.url));
  }

  // Therapists without a profile must complete onboarding
  if (userData?.role === "therapist" && !hasTherapistProfile && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (pathname === "/onboarding" && userData?.role !== "therapist") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (userData?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect admin to admin dashboard on root
  if (pathname === "/" && userData?.role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
