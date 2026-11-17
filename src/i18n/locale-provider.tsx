"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { createTranslator, type Translate } from "@/i18n/translate";

type LocaleContextValue = {
  locale: Locale;
  t: Translate;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t: createTranslator(locale) }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

export function useTranslate(): Translate {
  return useLocale().t;
}
