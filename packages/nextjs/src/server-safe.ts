// Server-safe stub for @intl-party/nextjs
// This file provides type-only exports for React Server Components

// Re-export safe types
export type {
  Locale,
  Namespace,
  TranslationKey,
  TranslationValue,
  I18nConfig,
} from "@intl-party/core";

export type { NextI18nConfig } from "./server-only";

// Middleware exports (safe to import)
export {
  createI18nMiddleware,
  createLocaleMatcher,
  createNextI18nConfig,
  type I18nMiddlewareConfig,
} from "./middleware";

// Stub functions that throw helpful errors if accidentally used on server
export function AppI18nProvider(): never {
  throw new Error(
    "AppI18nProvider is a client component and cannot be used in Server Components. " +
      'Import AppI18nProvider in a client component file marked with "use client".',
  );
}

export function NextIntlClientProvider(): never {
  throw new Error(
    "NextIntlClientProvider is a client component and cannot be used in Server Components. " +
      'Import NextIntlClientProvider in a client component file marked with "use client".',
  );
}
