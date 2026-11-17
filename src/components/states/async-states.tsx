"use client";

import { useTranslate } from "@/i18n/locale-provider";
import { Skeleton, StatePanel } from "@/components/states/state-panel";

export function LoadingState({ rows = 3 }: { rows?: number }) {
  const t = useTranslate();
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{t("states.loadingTitle")}</span>
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title?: string; body?: string }) {
  const t = useTranslate();
  return <StatePanel title={title ?? t("states.emptyTitle")} body={body ?? t("states.emptyBody")} />;
}

export function UnavailableState({ title, body }: { title?: string; body?: string }) {
  const t = useTranslate();
  return (
    <StatePanel
      tone="warning"
      title={title ?? t("states.unavailableTitle")}
      body={body ?? t("states.unavailableBody")}
    />
  );
}
