"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { LOCALE_COOKIE, writeCookie } from "@/lib/preferences";
import { useTranslate } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LocaleToggle({ current }: { current: Locale }) {
  const t = useTranslate();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(locale: Locale) {
    if (locale === current) return;
    writeCookie(LOCALE_COOKIE, locale, ONE_YEAR_SECONDS);
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={t("controls.language")}
      className="inline-flex items-center rounded-md border border-border-strong bg-surface p-0.5"
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            data-testid={`locale-${locale}`}
            aria-pressed={active}
            aria-label={t("controls.switchTo", { language: localeMeta[locale].label })}
            disabled={pending}
            onClick={() => switchTo(locale)}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              active
                ? "bg-primary text-primary-fg"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {localeMeta[locale].label}
          </button>
        );
      })}
    </div>
  );
}
