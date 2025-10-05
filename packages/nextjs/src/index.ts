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

// Re-export core and react for convenience, avoiding VERSION conflict
export * from "@intl-party/core";
export {
  I18nProvider,
  useTranslations,
  useLocale,
  useI18nContext as useI18n,
} from "@intl-party/react";
