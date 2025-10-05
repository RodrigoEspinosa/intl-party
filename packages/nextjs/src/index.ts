// Main exports
export {
  createI18nMiddleware,
  createLocaleMatcher,
  createNextI18nConfig,
  type I18nMiddlewareConfig,
} from "./middleware";

// Client exports (client components)
export {
  AppI18nProvider,
  NextIntlClientProvider,
  type NextI18nConfig,
  type AppI18nProviderProps,
  type NextIntlClientProviderProps,
} from "./client";

// Server exports (server components, but imported safely)
export {
  I18nLayout,
  generateStaticParams,
  generateMetadata,
  changeLocaleAction,
  withLocale,
  LocalizedLink,
  type I18nLayoutProps,
  type MetadataConfig,
  type LocalizedLinkProps,
} from "./app";

// Server-only exports - import from "@intl-party/nextjs/server"
export { getLocale, getLocaleFromParams } from "./app";

// Re-export core types for convenience
export type {
  Locale,
  Namespace,
  TranslationKey,
  TranslationValue,
  TranslationOptions,
  TranslationFunction,
  I18nConfig,
  I18nInstance,
} from "@intl-party/core";

// Note: React hooks should be imported directly from @intl-party/react
// to avoid bundling client code in server components
