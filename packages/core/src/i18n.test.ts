import { describe, it, expect, beforeEach } from "vitest";
import { createI18n } from "./i18n";
import type { I18nConfig } from "./types";

describe("I18n", () => {
  let config: I18nConfig;

  beforeEach(() => {
    config = {
      locales: ["en", "es", "fr"],
      defaultLocale: "en",
      namespaces: ["common", "auth"],
      fallbackChain: { es: "en", fr: "en" },
      detection: {
        strategies: [],
      },
    };
  });

  describe("createI18n", () => {
    it("should create an i18n instance with default configuration", () => {
      const i18n = createI18n(config);

      expect(i18n.getLocale()).toBe("en");
      expect(i18n.getAvailableLocales()).toEqual(["en", "es", "fr"]);
      expect(i18n.getAvailableNamespaces()).toEqual(["common", "auth"]);
    });

    it("should set initial locale if provided", () => {
      const i18n = createI18n({ ...config, defaultLocale: "es" });

      expect(i18n.getLocale()).toBe("es");
    });
  });

  describe("locale management", () => {
    it("should change locale successfully", () => {
      const i18n = createI18n(config);

      i18n.setLocale("es");
      expect(i18n.getLocale()).toBe("es");
    });

    it("should throw error for unsupported locale", () => {
      const i18n = createI18n(config);

      expect(() => i18n.setLocale("de")).toThrow(
        'Locale "de" is not supported',
      );
    });

    it("should emit locale change event", () => {
      const i18n = createI18n(config);
      let eventData: any = null;

      i18n.on("localeChange", (data) => {
        eventData = data;
      });

      i18n.setLocale("es");

      expect(eventData).toEqual({
        locale: "es",
        previousLocale: "en",
      });
    });
  });

  describe("namespace management", () => {
    it("should change namespace successfully", () => {
      const i18n = createI18n(config);

      i18n.setNamespace("auth");
      expect(i18n.getNamespace()).toBe("auth");
    });

    it("should throw error for unsupported namespace", () => {
      const i18n = createI18n(config);

      expect(() => i18n.setNamespace("invalid")).toThrow(
        'Namespace "invalid" is not supported',
      );
    });
  });

  describe("translations", () => {
    it("should add and retrieve translations", () => {
      const i18n = createI18n(config);
      const translations = {
        welcome: "Welcome!",
        hello: "Hello {{name}}!",
      };

      i18n.addTranslations("en", "common", translations);

      expect(i18n.t("welcome")).toBe("Welcome!");
      expect(i18n.hasTranslation("welcome")).toBe(true);
    });

    it("should interpolate variables", () => {
      const i18n = createI18n(config);
      const translations = {
        hello: "Hello {{name}}!",
      };

      i18n.addTranslations("en", "common", translations);

      const result = i18n.t("hello", { interpolation: { name: "World" } });
      expect(result).toBe("Hello World!");
    });

    it("should handle pluralization", () => {
      const i18n = createI18n(config);
      const translations = {
        items: "{{count|item|items}}",
      };

      i18n.addTranslations("en", "common", translations);

      expect(i18n.t("items", { count: 1 })).toBe("item");
      expect(i18n.t("items", { count: 2 })).toBe("items");
    });

    it("should use fallback chain", () => {
      const i18n = createI18n(config);

      i18n.addTranslations("en", "common", { welcome: "Welcome!" });
      i18n.setLocale("es");

      expect(i18n.t("welcome")).toBe("Welcome!");
    });

    it("should return fallback for missing keys", () => {
      const i18n = createI18n(config);

      const result = i18n.t("missing", { fallback: "Fallback text" });
      expect(result).toBe("Fallback text");
    });

    it("should return formatted missing key for missing translations", () => {
      const i18n = createI18n(config);

      const result = i18n.t("missing.key");
      expect(result).toBe("[common:missing.key]");
    });
  });

  describe("nested translations", () => {
    it("should handle nested translation keys", () => {
      const i18n = createI18n(config);
      const translations = {
        nav: {
          home: "Home",
          about: "About",
        },
      };

      i18n.addTranslations("en", "common", translations);

      expect(i18n.t("nav.home")).toBe("Home");
      expect(i18n.t("nav.about")).toBe("About");
    });
  });

  describe("scoped translations", () => {
    it("should create scoped translator", () => {
      const i18n = createI18n(config);
      const translations = {
        login: "Login",
        logout: "Logout",
      };

      i18n.addTranslations("en", "auth", translations);

      const authT = i18n.createScopedTranslator("auth");
      expect(authT("login")).toBe("Login");
    });
  });

  describe("validation", () => {
    it("should validate translations", () => {
      const i18n = createI18n(config);

      i18n.addTranslations("en", "common", { welcome: "Welcome!" });
      i18n.addTranslations("es", "common", { welcome: "Bienvenido!" });

      const result = i18n.validateTranslations();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing translations", () => {
      const i18n = createI18n(config);

      i18n.addTranslations("en", "common", { welcome: "Welcome!" });
      // Missing Spanish translation

      const result = i18n.validateTranslations();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("formatting utilities", () => {
    it("should format dates", () => {
      const i18n = createI18n(config);
      const date = new Date("2023-12-25");

      const formatted = i18n.formatDate(date, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      expect(typeof formatted).toBe("string");
      expect(formatted).toContain("2023");
    });

    it("should format numbers", () => {
      const i18n = createI18n(config);

      const formatted = i18n.formatNumber(1234.56);
      expect(typeof formatted).toBe("string");
    });

    it("should format currency", () => {
      const i18n = createI18n(config);

      const formatted = i18n.formatCurrency(99.99, "USD");
      expect(typeof formatted).toBe("string");
      expect(formatted).toContain("99.99");
    });
  });

  describe("statistics", () => {
    it("should provide runtime statistics", () => {
      const i18n = createI18n(config);

      const stats = i18n.getStats();

      expect(stats).toMatchObject({
        locale: "en",
        namespace: "common",
        availableLocales: 3,
        availableNamespaces: 2,
        cache: expect.any(Object),
        config: expect.any(Object),
      });
    });
  });

  describe("event system", () => {
    it("should handle event listeners", () => {
      const i18n = createI18n(config);
      let called = false;

      const listener = () => {
        called = true;
      };

      i18n.on("test", listener);
      i18n.emit("test", {});

      expect(called).toBe(true);

      // Test removing listener
      called = false;
      i18n.off("test", listener);
      i18n.emit("test", {});

      expect(called).toBe(false);
    });
  });

  describe("memory management", () => {
    it("should dispose resources properly", () => {
      const i18n = createI18n(config);

      expect(() => i18n.dispose()).not.toThrow();
    });
  });
});
