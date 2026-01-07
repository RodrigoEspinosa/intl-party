import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  TranslationValidator,
  createValidator,
  validateTranslations,
} from "./index";
import type { AllTranslations, ValidationConfig } from "../types";

describe("TranslationValidator", () => {
  let validator: TranslationValidator;
  let translations: AllTranslations;

  beforeEach(() => {
    validator = createValidator({
      strict: false,
      logMissing: false,
      throwOnMissing: false,
      validateFormats: true,
    });

    translations = {
      en: {
        common: {
          welcome: "Welcome!",
          hello: "Hello {{name}}!",
          nav: {
            home: "Home",
            about: "About",
          },
        },
        auth: {
          login: "Login",
          logout: "Logout",
        },
      },
      es: {
        common: {
          welcome: "¡Bienvenido!",
          hello: "Hola {{name}}!",
          nav: {
            home: "Inicio",
            about: "Acerca de",
          },
        },
        auth: {
          login: "Iniciar sesión",
          logout: "Cerrar sesión",
        },
      },
    };
  });

  describe("basic validation", () => {
    it("should validate complete translations successfully", () => {
      const result = validator.validate(
        translations,
        ["en", "es"],
        ["common", "auth"]
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing locales", () => {
      const incompleteTranslations = {
        en: translations.en,
        // Missing 'es' locale
      };

      const result = validator.validate(
        incompleteTranslations,
        ["en", "es"],
        ["common"]
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: "missing_namespace",
          locale: "es",
          message: "Missing locale: es",
        })
      );
    });

    it("should detect missing namespaces", () => {
      const incompleteTranslations = {
        en: {
          common: translations.en.common,
          // Missing 'auth' namespace
        },
        es: translations.es,
      };

      const result = validator.validate(
        incompleteTranslations,
        ["en", "es"],
        ["common", "auth"]
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: "missing_namespace",
          locale: "en",
          namespace: "auth",
          message: 'Missing namespace "auth" for locale "en"',
        })
      );
    });

    it("should detect missing translation keys", () => {
      const incompleteTranslations = {
        en: translations.en,
        es: {
          common: {
            welcome: "¡Bienvenido!",
            // Missing 'hello' and 'nav' keys
          },
          auth: translations.es.auth,
        },
      };

      const result = validator.validate(
        incompleteTranslations,
        ["en", "es"],
        ["common", "auth"]
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const missingKeyErrors = result.errors.filter(
        (error) => error.type === "missing_key"
      );
      expect(missingKeyErrors.length).toBeGreaterThan(0);
    });
  });

  describe("format validation", () => {
    it("should detect unmatched interpolation brackets", () => {
      const invalidTranslations = {
        en: {
          common: {
            invalid: "Hello {{name}!", // Missing closing }}
          },
        },
      };

      const result = validator.validate(
        invalidTranslations,
        ["en"],
        ["common"]
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: "invalid_format",
          key: "invalid",
          message: expect.stringContaining("Unmatched interpolation brackets"),
        })
      );
    });

    it("should detect invalid interpolation syntax", () => {
      const invalidTranslations = {
        en: {
          common: {
            invalid: "Hello {{{name}}}", // Invalid syntax
          },
        },
      };

      const result = validator.validate(
        invalidTranslations,
        ["en"],
        ["common"]
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: "invalid_format",
          key: "invalid",
          message: expect.stringContaining("Invalid interpolation syntax"),
        })
      );
    });

    it("should warn about very long translations", () => {
      const longText = "a".repeat(600);
      const longTranslations = {
        en: {
          common: {
            veryLong: longText,
          },
        },
      };

      const result = validator.validate(longTranslations, ["en"], ["common"]);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: "long_text",
          key: "veryLong",
          message: expect.stringContaining("very long"),
        })
      );
    });

    it("should warn about HTML in translations", () => {
      const htmlTranslations = {
        en: {
          common: {
            withHtml: 'Click <a href="/link">here</a>',
          },
        },
      };

      const result = validator.validate(htmlTranslations, ["en"], ["common"]);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: "inconsistent_format",
          key: "withHtml",
          message: expect.stringContaining("HTML markup"),
        })
      );
    });
  });

  describe("circular reference detection", () => {
    it("should detect circular references in translations", () => {
      const circularTranslations = {
        en: {
          common: {
            a: "{{ref:b}}",
            b: "{{ref:c}}",
            c: "{{ref:a}}", // Circular reference back to 'a'
          },
        },
      };

      const result = validator.validate(
        circularTranslations,
        ["en"],
        ["common"]
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: "circular_reference",
          message: expect.stringContaining("Circular reference detected"),
        })
      );
    });
  });

  describe("configuration options", () => {
    it("should log missing translations when enabled", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleGroupSpy = vi
        .spyOn(console, "group")
        .mockImplementation(() => {});
      const consoleGroupEndSpy = vi
        .spyOn(console, "groupEnd")
        .mockImplementation(() => {});

      const loggingValidator = createValidator({
        logMissing: true,
        throwOnMissing: false,
      });

      const incompleteTranslations = {
        en: { common: { welcome: "Welcome!" } },
        // Missing 'es' locale
      };

      loggingValidator.validate(
        incompleteTranslations,
        ["en", "es"],
        ["common"]
      );

      expect(consoleGroupSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleGroupSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it("should throw error when throwOnMissing is enabled", () => {
      const throwingValidator = createValidator({
        throwOnMissing: true,
        logMissing: false,
      });

      const incompleteTranslations = {
        en: { common: { welcome: "Welcome!" } },
        // Missing 'es' locale
      };

      expect(() => {
        throwingValidator.validate(
          incompleteTranslations,
          ["en", "es"],
          ["common"]
        );
      }).toThrow("Translation validation failed");
    });

    it("should skip format validation when disabled", () => {
      const noFormatValidator = createValidator({
        validateFormats: false,
      });

      const invalidTranslations = {
        en: {
          common: {
            invalid: "Hello {{name}!", // Missing closing }}
          },
        },
      };

      const result = noFormatValidator.validate(
        invalidTranslations,
        ["en"],
        ["common"]
      );

      const formatErrors = result.errors.filter(
        (error) => error.type === "invalid_format"
      );
      expect(formatErrors).toHaveLength(0);
    });
  });

  describe("completeness checking", () => {
    it("should check completeness against base locale", () => {
      const result = validator.checkCompleteness(
        translations,
        "en", // base locale
        ["es"], // target locales
        ["common", "auth"]
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing base locale", () => {
      const translationsWithoutBase = {
        es: translations.es,
        // Missing 'en' base locale
      };

      const result = validator.checkCompleteness(
        translationsWithoutBase,
        "en",
        ["es"],
        ["common"]
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: "missing_namespace",
          locale: "en",
          message: 'Base locale "en" not found',
        })
      );
    });

    it("should detect missing keys in target locales", () => {
      const incompleteTarget = {
        en: translations.en,
        es: {
          common: {
            welcome: "¡Bienvenido!",
            // Missing other keys from base locale
          },
          auth: translations.es.auth,
        },
      };

      const result = validator.checkCompleteness(
        incompleteTarget,
        "en",
        ["es"],
        ["common"]
      );

      expect(result.valid).toBe(false);
      const missingKeyErrors = result.errors.filter(
        (error) => error.type === "missing_key"
      );
      expect(missingKeyErrors.length).toBeGreaterThan(0);
    });
  });

  describe("validateTranslations function", () => {
    it("should work as standalone function", () => {
      const result = validateTranslations(
        translations,
        ["en", "es"],
        ["common", "auth"],
        { strict: false }
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
