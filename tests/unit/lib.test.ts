import { describe, expect, it } from "vitest";
import { resolveLocale, isLocale, localeMeta } from "@/i18n/config";
import { resolveTheme, isTheme } from "@/lib/preferences";
import { cn } from "@/lib/cn";

describe("locale resolution", () => {
  it("accepts supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("my")).toBe(true);
  });

  it("rejects unsupported values", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(resolveLocale("fr")).toBe("en");
  });

  it("declares metadata for every locale", () => {
    expect(localeMeta.en.htmlLang).toBe("en");
    expect(localeMeta.my.htmlLang).toBe("my");
  });
});

describe("theme resolution", () => {
  it("accepts light and dark", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
  });

  it("defaults unknown values to light", () => {
    expect(resolveTheme("neon")).toBe("light");
    expect(resolveTheme(undefined)).toBe("light");
  });
});

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, "b", null, undefined, "c")).toBe("a b c");
  });
});
