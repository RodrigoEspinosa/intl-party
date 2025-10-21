import type {
  TranslationKey,
  Locale,
  TranslationValue,
} from "@intl-party/core";

/**
 * Creates a type-safe translation function for a specific locale
 */
export function createTranslationFunction(
  locale: Locale,
  messages: Record<string, TranslationValue> = {}
) {
  return function t(
    key: TranslationKey,
    options?: Record<string, any>
  ): string {
    const keys = key.split(".");
    let value: any = messages;

    // Navigate through nested object structure
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(
          `Translation key "${key}" not found for locale "${locale}"`
        );
        return key; // Return key as fallback
      }
    }

    if (typeof value !== "string") {
      console.warn(`Translation value for "${key}" is not a string`);
      return key;
    }

    // Simple interpolation (can be enhanced with more sophisticated templating)
    if (options) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return options[key] || match;
      });
    }

    return value;
  };
}

/**
 * Gets all messages for a specific locale
 */
export function getLocaleMessages(
  locale: Locale,
  allMessages: Record<Locale, Record<string, TranslationValue>>
): Record<string, TranslationValue> {
  return allMessages[locale] || {};
}

/**
 * Gets all messages for all locales
 */
export function getAllMessages(): Record<
  Locale,
  Record<string, TranslationValue>
> {
  // In a real implementation, this would load from generated files
  // For now, return empty object
  return {} as Record<Locale, Record<string, TranslationValue>>;
}

/**
 * Validates if a translation key exists in generated types
 */
export function validateTranslationKey(key: string): key is TranslationKey {
  // This is a runtime check - in practice, TypeScript will catch this at compile time
  // But this can be useful for dynamic key validation
  return typeof key === "string" && key.length > 0;
}

/**
 * Gets all available locales from generated types
 */
export function getAvailableLocales(): Locale[] {
  // In a real implementation, this would return from generated types
  return ["en", "es", "fr", "de"] as Locale[];
}

/**
 * Gets all available namespaces from generated types
 */
export function getAvailableNamespaces(): string[] {
  // In a real implementation, this would return from generated types
  return ["common", "navigation"];
}

/**
 * Creates a client instance with utilities
 */
export function createClient() {
  return {
    t: createTranslationFunction,
    getLocaleMessages,
    getAllMessages,
    validateTranslationKey,
    getAvailableLocales,
    getAvailableNamespaces,
    messages: {},
  };
}

/**
 * Type-safe client instance
 */
export type IntlPartyClient = ReturnType<typeof createClient>;
