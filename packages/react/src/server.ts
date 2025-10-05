// Server-safe stub for @intl-party/react
// This file provides type-only exports for React Server Components

// Re-export types only
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

// Stub functions that throw helpful errors if accidentally called on server
export function useTranslations(): never {
  throw new Error(
    "useTranslations() is a client-side hook and cannot be used in Server Components. " +
      "Use getServerTranslations() from @intl-party/nextjs/server instead.",
  );
}

export function useLocale(): never {
  throw new Error(
    "useLocale() is a client-side hook and cannot be used in Server Components. " +
      "Use getLocale() from @intl-party/nextjs/server instead.",
  );
}

export function I18nProvider(): never {
  throw new Error(
    "I18nProvider is a client component and cannot be used in Server Components. " +
      "Use AppI18nProvider from @intl-party/nextjs in a client component instead.",
  );
}
