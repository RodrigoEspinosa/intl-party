// Main exports
export {
  createI18nMiddleware,
  createLocaleMatcher,
  createNextI18nConfig,
  type I18nMiddlewareConfig,
} from "./middleware";

// App Router exports
export {
  getLocale,
  getLocaleFromParams,
  AppI18nProvider,
  I18nLayout,
  generateStaticParams,
  generateMetadata,
  changeLocaleAction,
  withLocale,
  LocalizedLink,
  type NextI18nConfig,
  type AppI18nProviderProps,
  type I18nLayoutProps,
  type MetadataConfig,
  type LocalizedLinkProps,
} from "./app";

// Re-export core and react for convenience, avoiding VERSION conflict
export * from "@intl-party/core";
export {
  I18nProvider,
  useTranslations,
  useLocale,
  useI18nContext as useI18n,
} from "@intl-party/react";
