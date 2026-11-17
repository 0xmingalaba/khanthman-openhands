"use client";

import type { ReactNode } from "react";
import { useTranslate } from "@/i18n/locale-provider";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { DisclosureBanner } from "@/components/shell/disclosure-banner";
import type { Locale } from "@/i18n/config";

export function AppShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useTranslate();
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-fg"
      >
        {t("common.skipToContent")}
      </a>
      <DisclosureBanner />
      <Header locale={locale} />
      <main id="main-content" className="flex-1 py-8">
        <div className="kh-container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
