import type {
  Locale,
  Namespace,
  TranslationKey,
  AllTranslations,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationConfig,
} from "../types";
import { flattenTranslations } from "../utils/translation";

export class TranslationValidator {
  private config: ValidationConfig;

  constructor(config: ValidationConfig = {}) {
    this.config = {
      strict: false,
      logMissing: true,
      throwOnMissing: false,
      validateFormats: true,
      ...config,
    };
  }

  validate(
    translations: AllTranslations,
    supportedLocales: Locale[],
    requiredNamespaces: Namespace[],
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for missing locales
    for (const locale of supportedLocales) {
      if (!translations[locale]) {
        errors.push({
          type: "missing_namespace",
          locale,
          namespace: "",
          key: "",
          message: `Missing locale: ${locale}`,
        });
        continue;
      }

      // Check for missing namespaces
      for (const namespace of requiredNamespaces) {
        if (!translations[locale][namespace]) {
          errors.push({
            type: "missing_namespace",
            locale,
            namespace,
            key: "",
            message: `Missing namespace "${namespace}" for locale "${locale}"`,
          });
        }
      }
    }

    // Get all possible keys from all locales and namespaces
    const allKeys = this.getAllKeys(translations, requiredNamespaces);

    // Check for missing keys
    for (const locale of supportedLocales) {
      if (!translations[locale]) continue;

      for (const namespace of requiredNamespaces) {
        if (!translations[locale][namespace]) continue;

        const localeKeys = allKeys[namespace] || new Set();
        const currentKeys = new Set(
          Object.keys(flattenTranslations(translations[locale][namespace])),
        );

        // Find missing keys
        for (const key of localeKeys) {
          if (!currentKeys.has(key)) {
            errors.push({
              type: "missing_key",
              locale,
              namespace,
              key,
              message: `Missing translation key "${key}" in namespace "${namespace}" for locale "${locale}"`,
            });
          }
        }

        // Find unused keys (potential warnings)
        for (const key of currentKeys) {
          if (!localeKeys.has(key)) {
            warnings.push({
              type: "unused_key",
              locale,
              namespace,
              key,
              message: `Potentially unused translation key "${key}" in namespace "${namespace}" for locale "${locale}"`,
            });
          }
        }
      }
    }

    // Format validation
    if (this.config.validateFormats) {
      this.validateFormats(
        translations,
        supportedLocales,
        requiredNamespaces,
        errors,
        warnings,
      );
    }

    // Check for circular references
    this.checkCircularReferences(
      translations,
      supportedLocales,
      requiredNamespaces,
      errors,
    );

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
    };

    if (this.config.logMissing && errors.length > 0) {
      console.group("Translation Validation Errors:");
      errors.forEach((error) =>
        console.error(`${error.type}: ${error.message}`),
      );
      console.groupEnd();
    }

    if (this.config.throwOnMissing && errors.length > 0) {
      throw new Error(
        `Translation validation failed with ${errors.length} errors`,
      );
    }

    return result;
  }

  private getAllKeys(
    translations: AllTranslations,
    namespaces: Namespace[],
  ): Record<Namespace, Set<string>> {
    const allKeys: Record<Namespace, Set<string>> = {};

    // Initialize namespace sets
    for (const namespace of namespaces) {
      allKeys[namespace] = new Set();
    }

    // Collect all keys from all locales
    for (const locale of Object.keys(translations)) {
      for (const namespace of namespaces) {
        if (translations[locale][namespace]) {
          const flatKeys = Object.keys(
            flattenTranslations(translations[locale][namespace]),
          );
          flatKeys.forEach((key) => allKeys[namespace].add(key));
        }
      }
    }

    return allKeys;
  }

  private validateFormats(
    translations: AllTranslations,
    locales: Locale[],
    namespaces: Namespace[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    for (const locale of locales) {
      if (!translations[locale]) continue;

      for (const namespace of namespaces) {
        if (!translations[locale][namespace]) continue;

        const flatTranslations = flattenTranslations(
          translations[locale][namespace],
        );

        for (const [key, value] of Object.entries(flatTranslations)) {
          if (typeof value === "string") {
            this.validateStringFormat(
              value,
              locale,
              namespace,
              key,
              errors,
              warnings,
            );
          }
        }
      }
    }
  }

  private validateStringFormat(
    value: string,
    locale: Locale,
    namespace: Namespace,
    key: TranslationKey,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    // Check for unmatched interpolation brackets
    const openBrackets = (value.match(/\{\{/g) || []).length;
    const closeBrackets = (value.match(/\}\}/g) || []).length;

    if (openBrackets !== closeBrackets) {
      errors.push({
        type: "invalid_format",
        locale,
        namespace,
        key,
        message: `Unmatched interpolation brackets in "${key}": ${value}`,
      });
    }

    // Check for invalid interpolation syntax
    const invalidInterpolation = /\{\{[^}]*\{|\}[^}]*\}\}/g;
    if (invalidInterpolation.test(value)) {
      errors.push({
        type: "invalid_format",
        locale,
        namespace,
        key,
        message: `Invalid interpolation syntax in "${key}": ${value}`,
      });
    }

    // Warn about very long translations
    if (value.length > 500) {
      warnings.push({
        type: "long_text",
        locale,
        namespace,
        key,
        message: `Translation "${key}" is very long (${value.length} characters)`,
      });
    }

    // Check for HTML in translations (potential security warning)
    if (/<[^>]*>/g.test(value)) {
      warnings.push({
        type: "inconsistent_format",
        locale,
        namespace,
        key,
        message: `Translation "${key}" contains HTML markup which should be handled carefully`,
      });
    }
  }

  private checkCircularReferences(
    translations: AllTranslations,
    locales: Locale[],
    namespaces: Namespace[],
    errors: ValidationError[],
  ): void {
    for (const locale of locales) {
      if (!translations[locale]) continue;

      for (const namespace of namespaces) {
        if (!translations[locale][namespace]) continue;

        const flatTranslations = flattenTranslations(
          translations[locale][namespace],
        );
        const visited = new Set<string>();
        const visiting = new Set<string>();

        for (const key of Object.keys(flatTranslations)) {
          if (!visited.has(key)) {
            this.detectCircularReference(
              key,
              flatTranslations,
              visited,
              visiting,
              locale,
              namespace,
              errors,
            );
          }
        }
      }
    }
  }

  private detectCircularReference(
    key: string,
    translations: Record<string, any>,
    visited: Set<string>,
    visiting: Set<string>,
    locale: Locale,
    namespace: Namespace,
    errors: ValidationError[],
  ): void {
    if (visiting.has(key)) {
      errors.push({
        type: "circular_reference",
        locale,
        namespace,
        key,
        message: `Circular reference detected in translation key "${key}"`,
      });
      return;
    }

    if (visited.has(key)) return;

    visiting.add(key);

    const value = translations[key];
    if (typeof value === "string") {
      // Look for references to other keys in the value
      const references = value.match(/\{\{ref:([^}]+)\}\}/g);
      if (references) {
        for (const ref of references) {
          const refKey = ref.match(/\{\{ref:([^}]+)\}\}/)?.[1];
          if (refKey && translations[refKey]) {
            this.detectCircularReference(
              refKey,
              translations,
              visited,
              visiting,
              locale,
              namespace,
              errors,
            );
          }
        }
      }
    }

    visiting.delete(key);
    visited.add(key);
  }

  checkCompleteness(
    translations: AllTranslations,
    baseLocale: Locale,
    targetLocales: Locale[],
    namespaces: Namespace[],
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!translations[baseLocale]) {
      errors.push({
        type: "missing_namespace",
        locale: baseLocale,
        namespace: "",
        key: "",
        message: `Base locale "${baseLocale}" not found`,
      });
      return { valid: false, errors, warnings };
    }

    for (const namespace of namespaces) {
      if (!translations[baseLocale][namespace]) {
        errors.push({
          type: "missing_namespace",
          locale: baseLocale,
          namespace,
          key: "",
          message: `Base namespace "${namespace}" not found for locale "${baseLocale}"`,
        });
        continue;
      }

      const baseKeys = new Set(
        Object.keys(flattenTranslations(translations[baseLocale][namespace])),
      );

      for (const locale of targetLocales) {
        if (!translations[locale]?.[namespace]) {
          errors.push({
            type: "missing_namespace",
            locale,
            namespace,
            key: "",
            message: `Missing namespace "${namespace}" for locale "${locale}"`,
          });
          continue;
        }

        const localeKeys = new Set(
          Object.keys(flattenTranslations(translations[locale][namespace])),
        );

        for (const key of baseKeys) {
          if (!localeKeys.has(key)) {
            errors.push({
              type: "missing_key",
              locale,
              namespace,
              key,
              message: `Missing translation for key "${key}" in locale "${locale}"`,
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export function createValidator(
  config?: ValidationConfig,
): TranslationValidator {
  return new TranslationValidator(config);
}

export function validateTranslations(
  translations: AllTranslations,
  supportedLocales: Locale[],
  requiredNamespaces: Namespace[],
  config?: ValidationConfig,
): ValidationResult {
  const validator = createValidator(config);
  return validator.validate(translations, supportedLocales, requiredNamespaces);
}
