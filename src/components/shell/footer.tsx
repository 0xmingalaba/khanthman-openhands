"use client";

import { useTranslate } from "@/i18n/locale-provider";
import { Logo } from "@/components/shell/logo";

export function Footer() {
  const t = useTranslate();
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="kh-container flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-col">
            <span className="kh-my text-sm font-semibold text-fg">{t("common.appName")}</span>
            <span className="text-xs text-fg-subtle">{t("footer.rights")}</span>
          </div>
        </div>
        <p className="max-w-xl text-xs leading-6 text-fg-muted">{t("footer.disclaimer")}</p>
      </div>
    </footer>
  );
}
