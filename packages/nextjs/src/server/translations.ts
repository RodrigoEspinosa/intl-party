import { createI18n, type I18nConfig, type Locale } from "@intl-party/core";

// Server-side translation utilities for SSR
export interface ServerTranslationConfig extends I18nConfig {
  cookieName?: string;
}

// Create a server-side translation function
export function createServerTranslations(
  locale: Locale,
  config: ServerTranslationConfig,
  translations?: Record<string, Record<string, any>>,
) {
  const i18n = createI18n({
    ...config,
    detection: { strategies: [] }, // No detection on server
  });

  // Set the locale
  i18n.setLocale(locale);

  // Add translations if provided
  if (translations) {
    for (const [namespace, nsTranslations] of Object.entries(translations)) {
      i18n.addTranslations(locale, namespace, nsTranslations);
    }
  }

  // Return translation functions
  return {
    t: (key: string, options?: any) => i18n.t(key, options),
    tNamespace: (namespace: string) => (key: string, options?: any) =>
      i18n.t(key, { ...options, namespace }),
    i18n,
  };
}

// Convenient server translation hook-like function
export async function getServerTranslations(
  locale: Locale,
  namespace?: string,
  config?: ServerTranslationConfig,
  messages?: Record<string, any>,
) {
  const defaultConfig: ServerTranslationConfig = {
    locales: [locale],
    defaultLocale: locale,
    namespaces: namespace ? [namespace] : ["_flat"],
  };

  const finalConfig = { ...defaultConfig, ...config };
  const translations = messages
    ? { [namespace || "_flat"]: messages }
    : undefined;

  const { t, tNamespace } = createServerTranslations(
    locale,
    finalConfig,
    translations,
  );

  if (namespace) {
    return (key: string, options?: any) => t(key, { ...options, namespace });
  }

  return t;
}

// Server-side equivalent of useTranslations for SSR
export async function serverTranslations(
  locale: Locale,
  namespace?: string,
  messages?: Record<string, any>,
) {
  return getServerTranslations(locale, namespace, undefined, messages);
}
