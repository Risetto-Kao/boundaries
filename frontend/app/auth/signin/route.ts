import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEnabledAuthProviders, safeReturnTo } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  const next = safeReturnTo(request.nextUrl.searchParams.get("next"));
  const login = new URL("/login", request.url);
  login.searchParams.set("next", next);
  const provider = getEnabledAuthProviders().find((item) => item.id === request.nextUrl.searchParams.get("provider"));
  if (!provider) {
    login.searchParams.set("error", "unavailable");
    return NextResponse.redirect(login);
  }
  try {
    const origin = process.env.AUTH_SITE_URL || request.nextUrl.origin;
    const callback = new URL("/auth/callback", origin);
    callback.searchParams.set("next", next);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider.provider,
      options: { scopes: provider.scopes, redirectTo: callback.toString(), skipBrowserRedirect: true },
    });
    if (!error && data.url) return NextResponse.redirect(data.url);
  } catch { /* Show a recoverable error without exposing provider details. */ }
  login.searchParams.set("error", "signin");
  return NextResponse.redirect(login);
}
