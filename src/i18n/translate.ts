import { dictionaries, type Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Vars = Record<string, string | number>;

/**
 * Resolve a dot-path key (e.g. `"home.title"`) from a dictionary.
 * Returns `undefined` when the path is missing so callers can fall back safely.
 */
export function getByPath(dict: Dictionary, path: string): string | undefined {
  const segments = path.split(".");
  let current: unknown = dict;
  for (const segment of segments) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : undefined;
}

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = vars[token];
    return value === undefined ? match : String(value);
  });
}

export type Translate = (key: string, vars?: Vars) => string;

/**
 * Build a translator for a locale. Missing keys fall back to English, then to the
 * key itself, so the UI never renders `undefined`.
 */
export function createTranslator(locale: Locale): Translate {
  const dict = dictionaries[locale];
  const fallback = dictionaries.en;
  return (key, vars) => {
    const value = getByPath(dict, key) ?? getByPath(fallback, key) ?? key;
    return interpolate(value, vars);
  };
}

/** Collect every leaf key path in a dictionary (used by the parity test). */
export function collectKeys(dict: Dictionary, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(dict)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      keys.push(path);
    } else {
      keys.push(...collectKeys(value as unknown as Dictionary, path));
    }
  }
  return keys.sort();
}
