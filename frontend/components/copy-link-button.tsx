"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ label, path }: { label: string; path?: string }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const handleCopy = async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(path ? `${window.location.origin}${path}` : window.location.href);
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("error"); }
  };
  return <div className="max-w-full">
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} className={status === "copied" ? "text-success border-success" : undefined}>
      {status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {status === "copied" ? t("copied") : label}
    </Button>
    <span role="status" className={status === "error" ? "mt-2 block text-sm text-destructive" : "sr-only"}>{status === "error" ? t("copyFailed") : status === "copied" ? t("copied") : ""}</span>
  </div>;
}
