import type { MessageKey } from "@/lib/i18n/config";
import type { Provider } from "@supabase/supabase-js";

// Add future providers here after enabling them in Supabase Auth.
type AuthProvider = { id: string; labelKey: MessageKey; provider: Provider; scopes: string; enabledEnv: string; enabledByDefault?: boolean };
export const authProviders = [
  { id: "google", labelKey: "loginGoogle", provider: "google", scopes: "openid email profile", enabledEnv: "AUTH_GOOGLE_ENABLED", enabledByDefault: true },
  { id: "line", labelKey: "loginLine", provider: "custom:line", scopes: "openid profile", enabledEnv: "AUTH_LINE_ENABLED", enabledByDefault: false },
] as const satisfies readonly AuthProvider[];

export function isAccountHistoryEnabled() {
  return process.env.ACCOUNT_HISTORY_ENABLED === "true";
}

export function isAuthConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(isAccountHistoryEnabled() && url && key && !url.includes("your-project") && key !== "your-anon-key");
}

export function getEnabledAuthProviders() {
  if (!isAuthConfigured()) return [];
  return authProviders.filter((provider) => {
    const configured = process.env[provider.enabledEnv];
    return configured === undefined ? provider.enabledByDefault : configured === "true";
  });
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
