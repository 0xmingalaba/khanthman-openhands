import type { Locale } from "@/i18n/config";

export const THEME_COOKIE = "kh_theme";
export const LOCALE_COOKIE = "kh_locale";

export type Theme = "light" | "dark";

export const themes: readonly Theme[] = ["light", "dark"];

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

/** Resolve a theme from a cookie value, defaulting to light (deterministic SSR). */
export function resolveTheme(value: string | null | undefined): Theme {
  return isTheme(value) ? value : "light";
}

export function localeCookieOptions() {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax" as const,
  };
}

export function themeCookieOptions() {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax" as const,
  };
}

/** Write a preference cookie. Kept as a module function so components do not mutate globals inline. */
export function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};samesite=lax`;
}

export type { Locale };
