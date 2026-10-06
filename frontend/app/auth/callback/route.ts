import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured, safeReturnTo } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  const next = safeReturnTo(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");
  const origin = process.env.AUTH_SITE_URL || request.nextUrl.origin;
  if (code && !request.nextUrl.searchParams.has("error") && isAuthConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const { data, error: userError } = await supabase.auth.getUser();
        if (!userError && data.user && !data.user.is_anonymous) {
          const response = NextResponse.redirect(new URL(next, origin));
          response.headers.set("Cache-Control", "no-store");
          return response;
        }
      }
    } catch { /* Expired, cancelled, or invalid callbacks remain signed out. */ }
  }
  const login = new URL("/login", origin);
  login.searchParams.set("error", "callback");
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}
