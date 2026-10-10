"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Check, QrCode, Share2, UserPlus, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

export function InviteDialog({ title, path, inverted = false }: { title: string; path: string; inverted?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const changeOpen = (value: boolean) => {
    setOpen(value); setError("");
    if (value) { setUrl(new URL(path, window.location.origin).href); setCanShare(typeof navigator.share === "function"); setShowQr(false); setCopied(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setError(""); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2000); }
    catch { setError(t("copyFailed")); }
  };
  const share = async () => {
    try { await navigator.share({ title, url }); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setError(t("copyFailed")); }
  };
  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger asChild><Button variant="outline" size={inverted ? "default" : "sm"} className={inverted ? "border-white bg-white text-foreground" : ""}><UserPlus size={20} aria-hidden="true" />{t("inviteFriends")}</Button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="invite-overlay" /><Dialog.Content className="invite-dialog">
      <div className="pr-12"><Dialog.Title className="text-[28px] leading-[1.3] font-extrabold">{t("inviteTitle")}</Dialog.Title><Dialog.Description className="mt-1 text-[15px] font-bold text-muted-foreground [overflow-wrap:anywhere]">{title}</Dialog.Description></div>
      <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute top-5 right-4 text-foreground" aria-label={t("close")}><X size={24} aria-hidden="true" /></Button></Dialog.Close>
      <div className="link-row mt-5"><span className="link-row-text" title={url}>{url.replace(/^https?:\/\//, "")}</span><Button type="button" size="sm" onClick={copy} className={copied ? "bg-[var(--yes)] text-foreground hover:bg-[var(--yes)]" : ""}>{copied && <Check size={18} aria-hidden="true" />}{t(copied ? "copied" : "copy")}</Button></div>
      <div className="invite-actions">{canShare && <Button variant="outline" onClick={share}><Share2 size={20} aria-hidden="true" />{t("share")}</Button>}<Button variant="outline" onClick={() => setShowQr(!showQr)} aria-expanded={showQr} aria-controls="invite-qr" className={showQr ? "border-brand bg-brand-soft text-brand" : ""}><QrCode size={20} aria-hidden="true" />QR Code</Button></div>
      {showQr && <div id="invite-qr" className="invite-qr"><QRCodeSVG value={url} size={180} marginSize={4} fgColor="#16121F" title={url} /></div>}
      {copied && <span className="sr-only" role="status">{t("copied")}</span>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
