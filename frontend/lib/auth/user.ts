import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "./config";

export class AuthUnavailableError extends Error {}

export const getCurrentUser = cache(async () => {
  if (!isAuthConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    // Never silently save an authenticated request as a guest on Auth failures.
    throw new AuthUnavailableError("無法確認登入狀態，請重新登入後再試");
  }
  return data.user && !data.user.is_anonymous ? data.user : null;
});
