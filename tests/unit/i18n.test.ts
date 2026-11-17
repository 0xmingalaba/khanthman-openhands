import { describe, expect, it } from "vitest";
import { dictionaries } from "@/i18n/dictionaries";
import { collectKeys, createTranslator, getByPath, interpolate } from "@/i18n/translate";
import { locales } from "@/i18n/config";

describe("i18n dictionaries", () => {
  it("exposes a dictionary for every configured locale", () => {
    for (const locale of locales) {
      expect(dictionaries[locale]).toBeDefined();
    }
  });

  it("has identical key sets across locales (key parity)", () => {
    const enKeys = collectKeys(dictionaries.en);
    const myKeys = collectKeys(dictionaries.my);
    expect(myKeys).toEqual(enKeys);
  });

  it("has no empty translation strings", () => {
    for (const locale of locales) {
      const dict = dictionaries[locale];
      for (const key of collectKeys(dict)) {
        const value = getByPath(dict, key);
        expect(value, `${locale}:${key}`).toBeTruthy();
      }
    }
  });
});

describe("translate", () => {
  it("resolves nested keys", () => {
    const t = createTranslator("en");
    expect(t("home.title")).toBe(dictionaries.en.home.title);
  });

  it("interpolates variables", () => {
    expect(interpolate("Switch to {language}", { language: "English" })).toBe("Switch to English");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(interpolate("Hello {name}", {})).toBe("Hello {name}");
  });

  it("falls back to the key when a translation is missing", () => {
    const t = createTranslator("en");
    expect(t("does.not.exist")).toBe("does.not.exist");
  });
});
