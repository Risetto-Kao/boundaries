"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LoadingSpinner } from "@/components/loading-indicator";
import { Button } from "@/components/ui/button";

export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  return (
    <main className="page-shell page-shell-narrow space-y-6">
      <h1 className="page-heading">{t("pageUnavailable")}</h1>
      <div role="alert" className="feedback feedback-error">
        <p>{t("pageRetry")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" disabled={isRetrying} onClick={() => startRetry(() => {
          router.refresh();
          reset();
        })}>{isRetrying && <LoadingSpinner />}{t("reload")}</Button>
        <Link href="/" className="text-action">{t("backPortal")}</Link>
      </div>
    </main>
  );
}
