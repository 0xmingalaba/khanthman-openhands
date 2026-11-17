/**
 * Locale configuration. Adding a locale here requires a matching dictionary in
 * `src/i18n/dictionaries/`; the key-parity unit test enforces structural equality.
 */
export const locales = ["en", "my"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { label: string; htmlLang: string; dir: "ltr" | "rtl" }> = {
  en: { label: "English", htmlLang: "en", dir: "ltr" },
  my: { label: "မြန်မာ", htmlLang: "my", dir: "ltr" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}
