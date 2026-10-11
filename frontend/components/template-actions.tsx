"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { LoadingSpinner } from "@/components/loading-indicator";
export function TemplateActions({ id, signedIn, canEdit }: { id: string; signedIn: boolean; canEdit: boolean }) {
  const { t, locale } = useI18n(); const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function run(action: "copy" | "forms") {
    if (busy) return; setBusy(true); setError("");
    try { const res = await fetch(`/api/templates/${id}/${action}`, { method: "POST", headers: { "X-Boundaries-Locale": locale } }); const data = await res.json(); if (!res.ok) { setError(data.error ?? t("createFailed")); return; } router.push(data.url); router.refresh(); }
    catch { setError(t("createFailed")); } finally { setBusy(false); }
  }
  return <div className="mt-7 space-y-4"><div className="flex flex-wrap gap-3">{signedIn ? <><Button disabled={busy} onClick={() => run("forms")}>{busy && <LoadingSpinner />}{t("useTemplate")}</Button><Button disabled={busy} variant="outline" onClick={() => run("copy")}>{t("copyTemplate")}</Button></> : <Link className={buttonVariants()} href={`/login?next=${encodeURIComponent(`/templates/${id}`)}`}>{t("loginFirst")}</Link>}{canEdit && <Link className={buttonVariants({ variant: "outline" })} href={`/templates/${id}/edit`}>{t("editTemplate")}</Link>}</div>{error && <p role="alert" className="feedback feedback-error">{error}</p>}</div>;
}
