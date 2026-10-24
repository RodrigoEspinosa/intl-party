/**
 * @intl-party/client
 *
 * This package provides type-safe access to generated translations and utilities.
 * It's similar to @prisma/client in that it exposes generated types and runtime data.
 *
 * @deprecated Use `createI18n` from `@intl-party/core`, and
 * `intl-party generate --types` for type-checked keys. This package will be
 * removed in the next major version. See
 * https://github.com/RodrigoEspinosa/intl-party/issues/80
 */

// Re-export core types for convenience
export type {
  I18nConfig,
  TranslationValue,
  Namespace,
  Locale,
  TranslationKey,
} from "@intl-party/core";

// Export runtime utilities
export {
  createTranslationFunction,
  getLocaleMessages,
} from "./runtime";

// Export a default client instance for convenience
export { createClient } from "./runtime";
