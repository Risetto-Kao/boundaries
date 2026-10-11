"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { InviteDialog } from "@/components/invite-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/i18n/config";

type Props = { form: { id: string; title: string; description: string | null; updatedAt: string; isOpen: boolean; invitePath: string; questions: { id: string; text: string }[]; submissions: { id: string; submittedAt: string }[] } };
type Action = "metadata" | "close" | "open" | "reset" | "deleteSubmission" | "delete";
export function FormManagement({ form }: Props) {
  const { t, locale } = useI18n(); const router = useRouter(); const [title, setTitle] = useState(form.title); const [description, setDescription] = useState(form.description ?? ""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [confirmation, setConfirmation] = useState<{ action: Action; submissionId?: string } | null>(null);
  async function run(action: Action, submissionId?: string) {
    if (busy) return; setBusy(true); setError("");
    try {
      const res = await fetch(`/api/forms/${form.id}/manage`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Boundaries-Locale": locale }, body: JSON.stringify({ action, updatedAt: form.updatedAt, ...(action === "metadata" ? { title, description } : {}), ...(submissionId ? { submissionId } : {}) }) });
      const data = await res.json(); if (!res.ok) { setError(data.error ?? t("saveFailed")); return; }
      setConfirmation(null); if (action === "delete") router.push("/account"); router.refresh();
    } catch { setError(t("saveFailed")); } finally { setBusy(false); }
  }
  return <main className="page-shell page-shell-narrow space-y-7"><div><p className="eyebrow mb-4">{t("manageForm")}</p><h1 className="page-heading [overflow-wrap:anywhere]">{form.title}</h1><p className="page-description">{t("questionsFixed")}</p></div><form onSubmit={event => { event.preventDefault(); void run("metadata"); }} className="space-y-4"><fieldset disabled={busy} className="space-y-4"><div><label htmlFor="form-title" className="field-label">{t("title")}</label><Input id="form-title" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></div><div><label htmlFor="form-description" className="field-label">{t("description")}</label><Textarea id="form-description" maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} /></div><Button type="submit">{t("saveMetadata")}</Button></fieldset></form>
    <section className="space-y-4"><h2 className="text-xl font-extrabold">{t("inviteFriends")}</h2><p className="font-bold">{t("responseCount", { count: form.submissions.length })}</p><div className="flex flex-wrap gap-3"><InviteDialog title={form.title} path={form.invitePath} /><Link prefetch={false} href={form.invitePath} className={buttonVariants({ variant: "outline" })}>{t("fillFirst")}</Link><Button variant="outline" disabled={busy} onClick={() => run(form.isOpen ? "close" : "open")}>{t(form.isOpen ? "closeForm" : "reopenForm")}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmation({ action: "reset" })}>{t("resetInvite")}</Button></div>{!form.isOpen && <p>{t("formClosed")}</p>}<p className="text-sm text-muted-foreground">{t("resultsLocked")}</p><Link className="text-action" prefetch={false} href={`/forms/${form.id}/results`}>{t("viewResults")}</Link></section>
    <section className="space-y-3"><h2 className="text-xl font-extrabold">{t("questionList")}</h2><ol className="space-y-2">{form.questions.map((q, i) => <li key={q.id} className="history-row">Q{i + 1} · {q.text}</li>)}</ol></section>
    <section className="space-y-3"><h2 className="text-xl font-extrabold">{t("filledForms")}</h2>{!form.submissions.length && <p>{t("noSubmissions")}</p>}{form.submissions.map((submission, index) => <div key={submission.id} className="history-row flex flex-wrap items-center justify-between gap-4"><span>{t("submissionReference", { number: index + 1, date: formatDate(locale, submission.submittedAt, true) })}</span><Button variant="outline" disabled={busy} onClick={() => setConfirmation({ action: "deleteSubmission", submissionId: submission.id })}>{t("removeSubmission")}</Button></div>)}</section>
    <Button variant="outline" className="text-destructive" disabled={busy} onClick={() => setConfirmation({ action: "delete" })}>{t("deleteForm")}</Button>
    {confirmation && <div role="alertdialog" aria-modal="false" aria-labelledby="action-warning" className="feedback space-y-4"><p id="action-warning">{t(confirmation.action === "reset" ? "resetInviteWarning" : confirmation.action === "delete" ? "deleteFormWarning" : "removeSubmissionWarning")}</p><div className="flex gap-3"><Button disabled={busy} onClick={() => run(confirmation.action, confirmation.submissionId)}>{t("confirmAction")}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>{t("cancel")}</Button></div></div>}
    {error && <p role="alert" className="feedback feedback-error">{error}</p>}
  </main>;
}
