import type {
  TranslationKey,
  Locale,
  TranslationValue,
  Translations,
} from "@intl-party/core";

import {
  isICUFormat,
  formatICUMessage,
} from "@intl-party/core";

/**
 * Creates a type-safe translation function for a specific locale.
 * Supports both ICU MessageFormat and legacy {{variable}} format.
 */
export function createTranslationFunction(
  locale: Locale,
  messages: Translations = {}
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

    // Check if this is an ICU format message
    if (isICUFormat(value)) {
      // Build ICU values from options
      const icuValues: Record<string, TranslationValue> = { ...options };
      return formatICUMessage(value, locale, icuValues);
    }

    // Legacy format: simple interpolation with {{variable}}
    if (options) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return options[key] !== undefined ? String(options[key]) : match;
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
  allMessages: Record<Locale, Translations>
): Translations {
  return allMessages[locale] || {};
}

/**
 * Creates a client instance with utilities
 */
export function createClient() {
  return {
    t: createTranslationFunction,
    getLocaleMessages,
    messages: {},
  };
}

/**
 * Type-safe client instance
 */
export type IntlPartyClient = ReturnType<typeof createClient>;
