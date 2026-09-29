// @vitest-environment jsdom
// Mirrors the examples in README.md; update both together.
import { describe, it, expect, vi } from "vitest";
import { createI18n } from "./index";

describe("README examples", () => {
  it("quick start and translating", () => {
    const i18n = createI18n({
      locales: ["en", "es"],
      defaultLocale: "en",
      namespaces: ["common", "auth"],
    });
    i18n.addTranslations("en", "common", {
      welcome: "Welcome!",
      greeting: "Hello {{name}}!",
      navigation: { home: "Home" },
      items: "{{count}} {{count|item|items}}",
    });
    i18n.addTranslations("en", "auth", { title: "Sign in" });

    expect(i18n.getNamespace()).toBe("common");
    expect(i18n.t("welcome")).toBe("Welcome!");
    expect(i18n.t("greeting", { interpolation: { name: "Ada" } })).toBe(
      "Hello Ada!",
    );
    expect(i18n.t("navigation.home")).toBe("Home");
    expect(i18n.t("items", { count: 1 })).toBe("1 item");
    expect(i18n.t("items", { count: 5 })).toBe("5 items");
    expect(i18n.t("title", { namespace: "auth" })).toBe("Sign in");
    expect(i18n.t("missing", { fallback: "Default text" })).toBe(
      "Default text",
    );
    expect(i18n.hasTranslation("welcome")).toBe(true);
    expect(i18n.createScopedTranslator("auth")("title")).toBe("Sign in");
    expect(() => i18n.setLocale("de")).toThrow();
  });

  it("ICU plurals follow locale rules", () => {
    const i18n = createI18n({
      locales: ["en", "ru"],
      defaultLocale: "en",
      namespaces: ["common"],
    });
    i18n.addTranslations("ru", "common", {
      files:
        "{count, plural, one {# файл} few {# файла} many {# файлов} other {# файла}}",
    });
    i18n.setLocale("ru");
    expect([1, 3, 5, 21].map((count) => i18n.t("files", { count }))).toEqual([
      "1 файл",
      "3 файла",
      "5 файлов",
      "21 файл",
    ]);
  });

  it("fallback chain ends at the default locale", () => {
    const i18n = createI18n({
      locales: ["en", "es", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      fallbackChain: { fr: "es" },
    });
    i18n.addTranslations("en", "common", { onlyEn: "EN" });
    i18n.addTranslations("es", "common", { onlyEs: "ES" });
    i18n.setLocale("fr");
    expect(i18n.t("onlyEs")).toBe("ES");
    expect(i18n.t("onlyEn")).toBe("EN");
  });

  it("detection picks the initial locale", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === "intl-party-locale" ? "es" : null),
      setItem: () => {},
      removeItem: () => {},
    });
    const i18n = createI18n({
      locales: ["en", "es"],
      defaultLocale: "en",
      namespaces: ["common"],
      detection: {
        strategies: ["localStorage"],
        storageKey: "intl-party-locale",
      },
    });
    expect(i18n.getLocale()).toBe("es");
    vi.unstubAllGlobals();
  });

  it("events, validation, removal, formatters", () => {
    const i18n = createI18n({
      locales: ["en", "es"],
      defaultLocale: "en",
      namespaces: ["common"],
    });
    const listener = vi.fn();
    i18n.on("localeChange", listener);
    i18n.addTranslations("en", "common", { a: "A", b: "B" });
    i18n.addTranslations("es", "common", { a: "A" });
    i18n.setLocale("es");
    expect(listener).toHaveBeenCalledWith({
      locale: "es",
      previousLocale: "en",
    });
    const result = i18n.validateTranslations();
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(["valid", "errors", "warnings"]),
    );
    expect(result.valid).toBe(false);
    i18n.removeTranslations("es", "common");
    // Still resolvable through the default-locale fallback
    expect(i18n.hasTranslation("a")).toBe(true);
    expect(i18n.t("a")).toBe("A");
    expect(typeof i18n.formatNumber(1234.5)).toBe("string");
    expect(i18n.getAvailableLocales()).toEqual(["en", "es"]);
  });
});
