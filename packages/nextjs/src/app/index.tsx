"use client";

import React from "react";
import {
  createI18n,
  type I18nConfig,
  type Locale,
} from "@intl-party/core";
import { I18nProvider, type I18nProviderProps } from "@intl-party/react";

export interface NextI18nConfig extends I18nConfig {
  cookieName?: string;
  paramName?: string;
  pathSegment?: number;
  basePath?: string;
  notFoundBehavior?: "not-found" | "redirect" | "fallback";
  asyncTranslations?: boolean;
}

// App Router provider component - supports multi-locale preloading
export interface AppI18nProviderProps
  extends Omit<I18nProviderProps, "config"> {
  locale: Locale;
  config: NextI18nConfig;
  translations?: Record<string, any>;
  /** Multi-locale translations for instant switching */
  initialData?: Record<Locale, Record<string, any>>;
  /** Enable client-side locale switching without URL changes */
  enableClientSideRouting?: boolean;
}

export function AppI18nProvider({
  locale,
  config,
  translations,
  initialData,
  enableClientSideRouting = true,
  children,
  ...props
}: AppI18nProviderProps) {
  // Build the instance once per (locale, config, translations) change.
  // Creating it in the render body would make a fresh instance on every
  // parent re-render, churning context identity and dropping any
  // runtime-added translations.
  const i18n = React.useMemo(() => {
    const instance = createI18n({
      ...config,
      // Override detection to use the provided locale
      detection: {
        strategies: enableClientSideRouting ? ["cookie", "localStorage"] : [],
      },
    });

    instance.setLocale(locale);

    // Add translations for current locale if provided
    if (translations) {
      for (const [namespace, nsTranslations] of Object.entries(translations)) {
        instance.addTranslations(locale, namespace, nsTranslations);
      }
    }

    // Add multi-locale translations for instant switching
    if (initialData) {
      for (const [targetLocale, localeData] of Object.entries(initialData)) {
        for (const [namespace, nsTranslations] of Object.entries(localeData)) {
          instance.addTranslations(targetLocale, namespace, nsTranslations);
        }
      }
    }

    return instance;
  }, [locale, config, translations, initialData, enableClientSideRouting]);

  return (
    <I18nProvider {...props} i18n={i18n} initialLocale={locale}>
      {children}
    </I18nProvider>
  );
}

// ============================================================================
// NEXT-INTL COMPATIBILITY APIs
// ============================================================================

// Next-intl compatible provider (alias for AppI18nProvider)
export interface NextIntlClientProviderProps {
  locale: string;
  messages?: Record<string, any>;
  /** Multi-locale messages for instant switching */
  initialData?: Record<string, Record<string, any>>;
  children: React.ReactNode;
  /** Enable client-side locale switching */
  enableClientSideRouting?: boolean;
  timeZone?: string;
  onError?: (error: Error) => void;
}

export function NextIntlClientProvider({
  locale,
  messages,
  initialData,
  children,
  enableClientSideRouting = true,
  onError,
}: NextIntlClientProviderProps) {
  const config: NextI18nConfig = {
    locales: initialData ? Object.keys(initialData) : [locale],
    defaultLocale: locale,
    namespaces: ["_flat"], // Use flat namespace for next-intl compatibility
  };

  // Convert messages to intl-party format
  const translations = messages ? { _flat: messages } : undefined;

  // Convert initialData to intl-party format
  const convertedInitialData = initialData
    ? Object.fromEntries(
        Object.entries(initialData).map(([loc, msgs]) => [
          loc,
          { _flat: msgs },
        ]),
      )
    : undefined;

  return (
    <AppI18nProvider
      locale={locale}
      config={config}
      translations={translations}
      initialData={convertedInitialData}
      enableClientSideRouting={enableClientSideRouting}
      onError={onError}
    >
      {children}
    </AppI18nProvider>
  );
}

// Server-side compatibility helpers moved to @intl-party/nextjs/server
// to avoid bundling server code in client builds
