import type { Provider } from "@supabase/supabase-js";

// Add future providers here after enabling them in Supabase Auth.
type AuthProvider = { id: string; label: string; provider: Provider; scopes: string };
export const authProviders = [
  { id: "google", label: "使用 Google 登入", provider: "google", scopes: "openid email profile" },
] as const satisfies readonly AuthProvider[];

export function isAuthConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project") && key !== "your-anon-key");
}

export function safeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(value)) return "/account";
  try {
    const url = new URL(value, "https://boundaries.invalid");
    const pathname = decodeURIComponent(url.pathname);
    if (url.origin !== "https://boundaries.invalid" || pathname.startsWith("/auth/") || pathname === "/auth" || pathname.replace(/\/+$/, "") === "/login") return "/account";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/account";
  }
}

export function isSameOrigin(request: Request) {
  // Browser mutations must carry Origin, including guest submissions.
  return request.headers.get("origin") === new URL(request.url).origin;
}
