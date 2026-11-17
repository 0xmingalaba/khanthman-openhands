"use client";

import Link from "next/link";
import { useTranslate } from "@/i18n/locale-provider";
import { Logo } from "@/components/shell/logo";
import { PrimaryNav } from "@/components/shell/primary-nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LocaleToggle } from "@/components/shell/locale-toggle";
import type { Locale } from "@/i18n/config";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslate();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="kh-container flex h-16 items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Logo />
          <span className="kh-my text-sm font-semibold leading-tight text-fg sm:text-base">
            {t("common.appName")}
          </span>
        </Link>

        <div className="ms-auto flex items-center gap-2">
          <PrimaryNav variant="desktop" />
          <LocaleToggle current={locale} />
          <ThemeToggle />
          <PrimaryNav variant="mobile" />
        </div>
      </div>
    </header>
  );
}
