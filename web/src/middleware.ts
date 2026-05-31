import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    "/login",
    "/auth/callback",
    "/complete-profile",
    "/onboarding",
    "/therapists",
    "/emergency",
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

  const { data: userData } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (pathname === "/login") {
    if (userData?.role === "therapist") {
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

  if (pathname === "/onboarding" && userData?.role !== "therapist") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
