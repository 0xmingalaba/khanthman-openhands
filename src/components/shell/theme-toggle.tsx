"use client";

import { useTheme } from "@/lib/theme-provider";
import { useTranslate } from "@/i18n/locale-provider";

export function ThemeToggle() {
  const t = useTranslate();
  const { theme, toggleTheme } = useTheme();
  const nextLabel = theme === "dark" ? t("controls.themeLight") : t("controls.themeDark");
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`${t("controls.theme")}: ${nextLabel}`}
      title={`${t("controls.theme")}: ${nextLabel}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-surface text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <path
            d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
