"use client";

import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/config";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn("size-5 animate-spin motion-reduce:animate-none", className)}
    />
  );
}

export function PageLoading({ labelKey = "loadingForms" }: { labelKey?: MessageKey }) {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl" role="status" aria-busy="true">
        <div className="flex items-center gap-3 text-blue-700">
          <LoadingSpinner className="size-6" />
          <p className="text-base font-medium">{t(labelKey)}</p>
        </div>
        <p className="mt-2 text-sm text-slate-600">{t("loadingHint")}</p>
        <div aria-hidden="true" className="mt-8 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((card) => (
            <div key={card} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
              <div className="h-11 w-28 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
