import { describe, it, expect, beforeEach } from "vitest";
import { createI18n } from "./i18n";
import type { I18nConfig, I18nError } from "./types";

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
      validation: {
        logMissing: false,
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
        'Locale "de" is not supported'
      );
    });

    it("should emit locale change event", () => {
      const i18n = createI18n(config);
      let eventData: { locale: string; previousLocale: string } | null = null;

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
        'Namespace "invalid" is not supported'
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

      // Add translations for all required locales and namespaces
      i18n.addTranslations("en", "common", { welcome: "Welcome!" });
      i18n.addTranslations("en", "auth", { login: "Login" });
      i18n.addTranslations("es", "common", { welcome: "Bienvenido!" });
      i18n.addTranslations("es", "auth", { login: "Iniciar sesión" });
      i18n.addTranslations("fr", "common", { welcome: "Bienvenue!" });
      i18n.addTranslations("fr", "auth", { login: "Connexion" });

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

      i18n.on("localeChange", listener);
      i18n.setLocale("es");

      expect(called).toBe(true);

      // Test removing listener
      called = false;
      i18n.off("localeChange", listener);
      i18n.setLocale("fr");

      expect(called).toBe(false);
    });
  });

  describe("memory management", () => {
    it("should dispose resources properly", () => {
      const i18n = createI18n(config);

      expect(() => i18n.dispose()).not.toThrow();
    });
  });

  describe("config validation", () => {
    it("should throw on empty locales array", () => {
      expect(() =>
        createI18n({ ...config, locales: [] }),
      ).toThrow("`locales` must be a non-empty array");
    });

    it("should throw on locales containing empty strings", () => {
      expect(() =>
        createI18n({ ...config, locales: ["en", ""] }),
      ).toThrow("`locales` must not contain empty strings");
    });

    it("should throw on locales containing whitespace-only strings", () => {
      expect(() =>
        createI18n({ ...config, locales: ["en", "  "] }),
      ).toThrow("`locales` must not contain empty strings");
    });

    it("should throw when defaultLocale is empty", () => {
      expect(() =>
        createI18n({ ...config, defaultLocale: "" }),
      ).toThrow("`defaultLocale` must be a non-empty string");
    });

    it("should throw when defaultLocale is not in locales", () => {
      expect(() =>
        createI18n({ ...config, defaultLocale: "de" }),
      ).toThrow('`defaultLocale` "de" is not in `locales`');
    });

    it("should throw on empty namespaces array", () => {
      expect(() =>
        createI18n({ ...config, namespaces: [] }),
      ).toThrow("`namespaces` must be a non-empty array");
    });

    it("should throw on namespaces containing empty strings", () => {
      expect(() =>
        createI18n({ ...config, namespaces: ["common", ""] }),
      ).toThrow("`namespaces` must not contain empty strings");
    });

    it("should throw when fallbackChain key is not in locales", () => {
      expect(() =>
        createI18n({ ...config, fallbackChain: { de: "en" } }),
      ).toThrow('fallbackChain key "de" is not in `locales`');
    });

    it("should throw when fallbackChain value is not in locales", () => {
      expect(() =>
        createI18n({ ...config, fallbackChain: { es: "de" } }),
      ).toThrow('fallbackChain value "de" (for key "es") is not in `locales`');
    });

    it("should accept valid config without error", () => {
      expect(() => createI18n(config)).not.toThrow();
    });
  });

  describe("input validation", () => {
    it("should throw on empty string locale in setLocale", () => {
      const i18n = createI18n(config);
      expect(() => i18n.setLocale("")).toThrow(
        "Locale must be a non-empty string",
      );
    });

    it("should throw on whitespace-only locale in setLocale", () => {
      const i18n = createI18n(config);
      expect(() => i18n.setLocale("  ")).toThrow(
        "Locale must be a non-empty string",
      );
    });

    it("should throw on empty string namespace in setNamespace", () => {
      const i18n = createI18n(config);
      expect(() => i18n.setNamespace("")).toThrow(
        "Namespace must be a non-empty string",
      );
    });

    it("should throw on whitespace-only namespace in setNamespace", () => {
      const i18n = createI18n(config);
      expect(() => i18n.setNamespace("   ")).toThrow(
        "Namespace must be a non-empty string",
      );
    });
  });

  describe("prototype pollution protection", () => {
    it("should strip __proto__ keys from translations", () => {
      const i18n = createI18n(config);
      const malicious = Object.create(null);
      malicious.safe = "Hello";
      malicious["__proto__"] = { polluted: "injected" };

      i18n.addTranslations("en", "common", malicious);
      expect(i18n.t("safe")).toBe("Hello");
      expect(i18n.hasTranslation("__proto__")).toBe(false);
    });

    it("should strip constructor keys from nested translations", () => {
      const i18n = createI18n(config);
      const nested = Object.create(null);
      nested.safe = "value";
      nested["constructor"] = "bad";

      i18n.addTranslations("en", "common", { nested });
      expect(i18n.t("nested.safe")).toBe("value");
      expect(i18n.hasTranslation("nested.constructor")).toBe(false);
    });
  });

  describe("onError callback", () => {
    it("should call onError when event listener throws", () => {
      const errors: I18nError[] = [];
      const i18n = createI18n({
        ...config,
        onError: (err) => errors.push(err),
      });

      i18n.on("localeChange", () => {
        throw new Error("listener boom");
      });

      // Should not throw — error is routed to onError
      expect(() => i18n.setLocale("es")).not.toThrow();
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("LISTENER_ERROR");
      expect(errors[0].cause).toBeInstanceOf(Error);
    });

    it("should still emit events after a listener error", () => {
      const errors: I18nError[] = [];
      const results: string[] = [];
      const i18n = createI18n({
        ...config,
        onError: (err) => errors.push(err),
      });

      // First listener throws
      i18n.on("localeChange", () => {
        throw new Error("boom");
      });
      // Second listener should still run
      i18n.on("localeChange", ({ locale }) => {
        results.push(locale);
      });

      i18n.setLocale("es");
      expect(results).toEqual(["es"]);
      expect(errors).toHaveLength(1);
    });

    it("should use custom onError and not crash", () => {
      let capturedError: I18nError | null = null;
      const i18n = createI18n({
        ...config,
        onError: (err) => {
          capturedError = err;
        },
      });

      i18n.on("localeChange", () => {
        throw new Error("boom");
      });

      // Should not throw — error is routed to onError
      expect(() => i18n.setLocale("es")).not.toThrow();
      expect(capturedError).not.toBeNull();
      expect(capturedError!.code).toBe("LISTENER_ERROR");
    });
  });

  describe("no-op deduplication", () => {
    it("should not emit localeChange when setting same locale", () => {
      const i18n = createI18n(config);
      let eventCount = 0;

      i18n.on("localeChange", () => {
        eventCount++;
      });

      i18n.setLocale("es");
      expect(eventCount).toBe(1);

      // Same locale again — should be a no-op
      i18n.setLocale("es");
      expect(eventCount).toBe(1);
    });

    it("should not emit namespaceChange when setting same namespace", () => {
      const i18n = createI18n(config);
      let eventCount = 0;

      i18n.on("namespaceChange", () => {
        eventCount++;
      });

      i18n.setNamespace("auth");
      expect(eventCount).toBe(1);

      // Same namespace again — should be a no-op
      i18n.setNamespace("auth");
      expect(eventCount).toBe(1);
    });
  });

  describe("locale version counter", () => {
    it("should start at 0", () => {
      const i18n = createI18n(config);
      expect(i18n.localeVersion).toBe(0);
    });

    it("should increment on setLocale", () => {
      const i18n = createI18n(config);

      i18n.setLocale("es");
      expect(i18n.localeVersion).toBe(1);

      i18n.setLocale("fr");
      expect(i18n.localeVersion).toBe(2);
    });

    it("should not increment on no-op setLocale", () => {
      const i18n = createI18n(config);

      i18n.setLocale("es");
      expect(i18n.localeVersion).toBe(1);

      i18n.setLocale("es"); // same locale
      expect(i18n.localeVersion).toBe(1);
    });

    it("should skip stale preload completion events", async () => {
      const i18n = createI18n(config);
      let preloadedCount = 0;

      i18n.on("translationsPreloaded", () => {
        preloadedCount++;
      });

      // Start preloading for "es"
      const preloadPromise = i18n.preloadTranslations("es", "common");

      // Immediately switch locale — this bumps the version
      i18n.setLocale("fr");

      // Wait for the preload to finish
      await preloadPromise;

      // The preloaded event should NOT have fired because locale changed
      expect(preloadedCount).toBe(0);
      expect(i18n.getLocale()).toBe("fr");
    });

    it("should emit preloaded when locale has not changed", async () => {
      const i18n = createI18n(config);
      let preloadedCount = 0;

      i18n.on("translationsPreloaded", () => {
        preloadedCount++;
      });

      await i18n.preloadTranslations("en", "common");

      expect(preloadedCount).toBe(1);
    });
  });
});
