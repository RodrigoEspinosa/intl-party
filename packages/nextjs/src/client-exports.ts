"use client";

/**
 * Client-specific exports for @intl-party/nextjs
 * These should only be imported in client components
 */

// Main provider (auto-loads messages)
export {
  Provider,
  useZeroTranslations,
  useZeroTranslations as useTranslations,
  useLocale,
} from "./provider";

// Client components and providers
export {
  AppI18nProvider,
  NextIntlClientProvider,
  type AppI18nProviderProps,
  type NextIntlClientProviderProps,
} from "./client";

// Client utilities
export {
  createClientProviderData,
  createClientI18nSetup,
} from "./client-utils";

// URL helpers for locale-prefixed routing
export { localizePath, type RoutingConfig } from "./routing";
