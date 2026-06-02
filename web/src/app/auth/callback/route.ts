import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = cookies();
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role, name")
          .eq("id", user.id)
          .single();

        let redirectUrl = `${origin}${next}`;
        if (userData) {
          if (!userData.name) {
            redirectUrl = `${origin}/complete-profile`;
          } else if (userData.role === "admin") {
            redirectUrl = `${origin}/admin/dashboard`;
          } else if (userData.role === "therapist") {
            redirectUrl = `${origin}/dashboard`;
          }
        }

        const response = NextResponse.redirect(redirectUrl);
        cookieJar.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        return response;
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
