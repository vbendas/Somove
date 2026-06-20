import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["pt", "en", "es", "fr", "de", "it", "nl", "pt-BR", "pt-PT"];
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

  const publicRoutes = [
    "/login",
    "/auth/callback",
    "/complete-profile",
    "/onboarding",
    "/therapists",
    "/emergency",
    "/setup",
    "/invite",
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

  if (!user && isPublicRoute) return supabaseResponse;

  if (!user) {
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
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
