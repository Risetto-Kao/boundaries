import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured, isSameOrigin } from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "無效的請求來源" }, { status: 403 });
  if (isAuthConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) return NextResponse.json({ error: "登出失敗，請稍後再試" }, { status: 503 });
    } catch {
      return NextResponse.json({ error: "登出失敗，請稍後再試" }, { status: 503 });
    }
  }
  return NextResponse.redirect(new URL("/", request.url), 303);
}
