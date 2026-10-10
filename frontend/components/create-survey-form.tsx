"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Globe, GripVertical, Plus, Trash2, Triangle, X } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useI18n } from "@/components/i18n-provider";
import { AccountMenu } from "@/components/account-menu";
import { languages, type Locale } from "@/lib/i18n/config";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/loading-indicator";

type EditorQuestion = { id: string; text: string };
type InitialSurvey = { id: string; title: string; description: string | null; updatedAt: string; questions: EditorQuestion[] };
type CreateResult = { surveyId: string; fillUrl: string; resultUrl: string };

function QuestionRow({ question, index, removeDisabled, disabled, update, remove, move }: {
  question: EditorQuestion; index: number; removeDisabled: boolean; disabled: boolean;
  update: (id: string, text: string) => void; remove: (id: string) => void; move: (id: string, direction: number) => void;
}) {
  const { t, locale } = useI18n();
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const resize = () => {
      if (!textarea.current) return;
      textarea.current.style.height = "auto";
      textarea.current.style.height = `${textarea.current.scrollHeight}px`;
    };
    resize();
    void document.fonts.ready.then(resize);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [question.text, locale]);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: question.id, disabled });
  return <div ref={setNodeRef} className="question-editor" data-dragging={isDragging} style={{ transform: CSS.Transform.toString(transform), transition: transition ?? "transform .18s" }}>
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} disabled={disabled} className="question-handle" aria-label={t("reorderQuestion", { count: index + 1 })} onKeyDown={event => {
      if (!isDragging && ["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); move(question.id, event.key === "ArrowUp" ? -1 : 1); }
      else listeners?.onKeyDown?.(event);
    }}><GripVertical size={18} aria-hidden="true" /></button>
    <span className="text-base font-extrabold text-brand" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    <textarea ref={textarea} id={`question-${question.id}`} value={question.text} rows={1} onChange={event => update(question.id, event.target.value)} placeholder={t("questionPlaceholder")} aria-label={t("questionNumber", { count: index + 1 })} disabled={disabled} />
    <Button type="button" variant="ghost" size="icon" disabled={removeDisabled || disabled} className="h-[52px] text-muted-foreground disabled:opacity-30" aria-label={t("deleteQuestion", { count: index + 1 })} onClick={() => remove(question.id)}><Trash2 size={18} aria-hidden="true" /></Button>
  </div>;
}

export function CreateSurveyForm({ initialSurvey, signedIn = false, displayName = null }: { initialSurvey?: InitialSurvey; signedIn?: boolean; displayName?: string | null }) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState(initialSurvey?.title ?? "");
  const [description, setDescription] = useState(initialSurvey?.description ?? "");
  const [questions, setQuestions] = useState<EditorQuestion[]>(initialSurvey?.questions ?? [{ id: "new-0", text: "" }]);
  const [revision, setRevision] = useState(initialSurvey?.updatedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const counter = useRef(1);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  useEffect(() => { if (result) successHeading.current?.focus(); }, [result]);
  const valid = Boolean(title.trim() && questions.some(question => question.text.trim()));
  const update = (id: string, text: string) => setQuestions(previous => previous.map(question => question.id === id ? { ...question, text } : question));
  const remove = (id: string) => setQuestions(previous => previous.length > 1 ? previous.filter(question => question.id !== id) : previous);
  const move = (id: string, direction: number) => setQuestions(previous => {
    const from = previous.findIndex(question => question.id === id); const to = from + direction;
    return to >= 0 && to < previous.length ? arrayMove(previous, from, to) : previous;
  });
  const add = () => {
    if (questions.length >= 20 || busy) return;
    const id = `new-${counter.current++}`; setQuestions(previous => [...previous, { id, text: "" }]);
    requestAnimationFrame(() => document.getElementById(`question-${id}`)?.focus());
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy || !valid) return;
    setBusy(true); setError("");
    const nonempty = questions.filter(question => question.text.trim());
    try {
      const response = await fetch(initialSurvey ? `/api/surveys/${initialSurvey.id}` : "/api/surveys", {
        method: initialSurvey ? "PATCH" : "POST", headers: { "Content-Type": "application/json", "X-Boundaries-Locale": locale },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), ...(initialSurvey ? { updatedAt: revision, questions: nonempty.map(question => ({ ...(question.id.startsWith("new-") ? {} : { id: question.id }), text: question.text.trim() })) } : { questions: nonempty.map(question => question.text.trim()) }) }),
      });
      const payload = await response.json();
      if (!response.ok) { setError(payload.error ?? t(initialSurvey ? "saveFailed" : "createFailed")); return; }
      if (initialSurvey) {
        setRevision(payload.updatedAt); setQuestions(payload.questions); setSaved(true);
        if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setSaved(false), 1800);
        router.refresh();
      } else { setResult(payload); setShareUrl(new URL(payload.fillUrl, window.location.origin).href); }
    } catch { setError(t(initialSurvey ? "saveFailed" : "createFailed")); }
    finally { setBusy(false); }
  };
  const deleteSurvey = async () => {
    if (!initialSurvey || busy) return; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/surveys/${initialSurvey.id}`, { method: "DELETE", headers: { "X-Boundaries-Locale": locale } });
      if (!response.ok) { const payload = await response.json(); setError(payload.error ?? t("deleteFailed")); return; }
      router.push("/surveys"); router.refresh();
    } catch { setError(t("deleteFailed")); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 1800); }
    catch { setError(t("copyFailed")); }
  };
  if (result) return <main className="page-shell page-shell-narrow success-screen">
    <div className="success-check answer-yes"><Check size={48} aria-hidden="true" /></div>
    <h1 ref={successHeading} tabIndex={-1} className="text-[clamp(40px,6vw,56px)] leading-tight font-extrabold">{t("created")}</h1>
    <p className="mt-4 text-lg font-bold text-muted-foreground [overflow-wrap:anywhere]">{title}</p>
    <div className="link-row mt-8"><span className="link-row-text" title={shareUrl}>{shareUrl}</span><Button type="button" size="sm" onClick={copy}>{t(copied ? "copied" : "copyLink")}</Button></div>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-6"><Link href={result.fillUrl} className={buttonVariants({ variant: "outline" })}>{t("fillFirst")}</Link><Link href="/surveys" className="text-action">{t("backList")}</Link></div>
    {copied && <span role="status" className="sr-only">{t("copied")}</span>}{error && <p role="alert" className="feedback feedback-error mt-6">{error}</p>}
  </main>;
  return <>
    <header className="editor-bar"><div className="editor-bar-inner">
      <Link href="/surveys" className={buttonVariants({ variant: "ghost", size: "icon", className: "text-foreground" })} aria-label={t("close")}><X size={24} aria-hidden="true" /></Link>
      <div className="flex items-center gap-3">
        <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button type="button" variant="ghost" size="icon" className="text-foreground" aria-label={t("language")}><Globe size={22} aria-hidden="true" /></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="filter-menu"><DropdownMenu.RadioGroup value={locale} onValueChange={value => setLocale(value as Locale)}>{(Object.keys(languages) as Locale[]).map(value => <DropdownMenu.RadioItem key={value} value={value} className="filter-item">{languages[value].name}<DropdownMenu.ItemIndicator><Check size={18} aria-hidden="true" /></DropdownMenu.ItemIndicator></DropdownMenu.RadioItem>)}</DropdownMenu.RadioGroup></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
        <AccountMenu signedIn={signedIn} displayName={displayName} />
        <Button form="survey-editor" type="submit" size="sm" disabled={!valid || busy}>{busy && <LoadingSpinner />}{t(initialSurvey ? "saveAction" : "createAction")}</Button>
      </div>
    </div></header>
    <main className="page-shell page-shell-narrow editor-content">
      <h1 className="editor-heading">{t(initialSurvey ? "editForm" : "newForm")}</h1>
      <form id="survey-editor" onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="min-w-0">
          <div className="editor-fields"><div><label className="field-label" htmlFor="survey-title">{t("title")}</label><Input id="survey-title" placeholder={t("titlePlaceholder")} value={title} onChange={event => setTitle(event.target.value)} maxLength={200} required className="text-[17px] font-bold" /></div><div><label className="field-label" htmlFor="survey-description">{t("description")}</label><Textarea id="survey-description" placeholder={t("descriptionPlaceholder")} value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} /></div></div>
          <section className="questions-section" aria-labelledby="questions-heading">
            <div className="mb-5 flex items-center justify-between gap-4"><h2 id="questions-heading" className="text-2xl font-extrabold">{t("questionList")}</h2><div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground"><span aria-hidden="true" className="flex gap-1">{[{ Icon: Check, style: "answer-yes" }, { Icon: Triangle, style: "answer-depends" }, { Icon: X, style: "answer-no" }].map(({ Icon, style }) => <span key={style} className={`grid size-[22px] place-items-center rounded-full ${style}`}><Icon size={14} /></span>)}</span><span>{questions.length} / 20</span></div></div>
            <DndContext id="survey-question-sort" sensors={sensors} collisionDetection={closestCenter} accessibility={{ screenReaderInstructions: { draggable: t("dragInstructions") }, announcements: {
              onDragStart: ({ active }) => t("dragStart", { count: questions.findIndex(q => q.id === active.id) + 1 }),
              onDragOver: ({ over }) => over ? t("dragMove", { count: questions.findIndex(q => q.id === over.id) + 1 }) : undefined,
              onDragEnd: ({ active, over }) => t("dragEnd", { count: questions.findIndex(q => q.id === (over?.id ?? active.id)) + 1 }),
              onDragCancel: () => t("dragCancel"),
            } }} onDragEnd={({ active, over }) => { if (over && active.id !== over.id) setQuestions(previous => arrayMove(previous, previous.findIndex(q => q.id === active.id), previous.findIndex(q => q.id === over.id))); }}>
              <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}><div className="space-y-2.5">{questions.map((question, index) => <QuestionRow key={question.id} question={question} index={index} disabled={busy} removeDisabled={questions.length === 1} update={update} remove={remove} move={move} />)}</div></SortableContext>
            </DndContext>
            <button type="button" className="add-question" onClick={add} disabled={questions.length >= 20 || busy}><Plus size={20} aria-hidden="true" />{t("addQuestion")}</button>
          </section>
        </fieldset>
        {error && <p role="alert" className="feedback feedback-error mt-6">{error}</p>}
      </form>
      {initialSurvey && <div className="mt-10 flex items-center justify-end gap-3 border-t border-border pt-5">{confirmDelete ? <><span className="font-extrabold">{t("confirmDelete")}</span><Button type="button" variant="outline" size="icon-lg" onClick={() => setConfirmDelete(false)} disabled={busy} aria-label={t("cancel")}><X aria-hidden="true" /></Button><Button type="button" size="icon-lg" onClick={deleteSurvey} disabled={busy} aria-label={t("deleteForm")} className="bg-[var(--no)] text-[var(--ink)] hover:bg-[var(--no)]"><Trash2 aria-hidden="true" /></Button></> : <Button type="button" size="icon-lg" onClick={() => setConfirmDelete(true)} aria-label={t("deleteForm")} className="bg-[var(--no-50)] text-destructive hover:bg-[var(--no-50)]"><Trash2 aria-hidden="true" /></Button>}</div>}
      {saved && <div role="status" className="toast"><Check size={20} className="text-[var(--yes)]" aria-hidden="true" />{t("saved")}</div>}
    </main>
  </>;
}
