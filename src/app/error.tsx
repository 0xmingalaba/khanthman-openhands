"use client";

import { useEffect } from "react";
import { useTranslate } from "@/i18n/locale-provider";
import { StatePanel } from "@/components/states/state-panel";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslate();

  useEffect(() => {
    // Surface the error for local diagnostics without leaking details to the UI.
    console.error(error);
  }, [error]);

  return (
    <StatePanel
      tone="danger"
      title={t("states.errorTitle")}
      body={t("states.errorBody")}
      action={<Button onClick={reset}>{t("common.retry")}</Button>}
    />
  );
}
