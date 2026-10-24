import type {
  TranslationKey,
  Locale,
  TranslationValue,
  Translations,
} from "@intl-party/core";

import {
  isICUFormat,
  formatICUMessage,
  splitEscapedDots,
} from "@intl-party/core";
import { warnClientDeprecated } from "./deprecation";

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Creates a type-safe translation function for a specific locale.
 * Supports both ICU MessageFormat and legacy {{variable}} format.
 *
 * @deprecated Use `createI18n` from `@intl-party/core`. This package will be
 * removed in the next major version. See
 * https://github.com/RodrigoEspinosa/intl-party/issues/80
 */
export function createTranslationFunction(
  locale: Locale,
  messages: Translations = {}
) {
  warnClientDeprecated();
  return function t(
    key: TranslationKey,
    options?: Record<string, TranslationValue>
  ): string {
    // Respect escaped dots (\\.) and use hasOwnProperty so a key like
    // "constructor" resolves from the data, not from Object.prototype.
    const keys = splitEscapedDots(key);
    let value: TranslationValue | Translations = messages;

    // Navigate through nested object structure
    for (const k of keys) {
      if (value && typeof value === "object" && hasOwn.call(value, k)) {
        value = (value as Translations)[k];
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
 *
 * @deprecated This package will be removed in the next major version. See
 * https://github.com/RodrigoEspinosa/intl-party/issues/80
 */
export function getLocaleMessages(
  locale: Locale,
  allMessages: Record<Locale, Translations>
): Translations {
  return allMessages[locale] || {};
}

/**
 * Creates a client instance bound to a locale and its messages.
 *
 * Returns a ready-to-use translation function plus the messages it resolves
 * against, instead of the unbound factory the previous implementation exposed.
 *
 * @deprecated Use `createI18n` from `@intl-party/core`. This package will be
 * removed in the next major version. See
 * https://github.com/RodrigoEspinosa/intl-party/issues/80
 */
export function createClient(
  locale: Locale,
  messages: Translations = {},
) {
  return {
    locale,
    t: createTranslationFunction(locale, messages),
    messages,
    getLocaleMessages,
  };
}

/**
 * Client instance returned by `createClient`
 *
 * @deprecated This package will be removed in the next major version.
 */
export type IntlPartyClient = ReturnType<typeof createClient>;
