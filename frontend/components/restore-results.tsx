"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
export function RestoreResults({ id, invite }: { id: string; invite: string }) {
  const { t, locale } = useI18n(); const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function restore() {
    if (busy) return; setBusy(true); setError("");
    try { const res = await fetch(`/api/forms/${id}/access`, { method: "POST", headers: { "Content-Type": "application/json", "X-Boundaries-Locale": locale }, body: JSON.stringify({ invite }) }); const data = await res.json(); if (!res.ok) { setError(data.error ?? t("restoreFailed")); return; } router.push(data.resultUrl); router.refresh(); }
    catch { setError(t("restoreFailed")); } finally { setBusy(false); }
  }
  return <div className="space-y-4"><Button disabled={busy} onClick={restore}>{t("restoreResults")}</Button>{error && <p role="alert" className="feedback feedback-error">{error}</p>}</div>;
}
