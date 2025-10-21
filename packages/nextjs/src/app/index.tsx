import React from "react";
import {
  I18n,
  createI18n,
  type I18nConfig,
  type Locale,
} from "@intl-party/core";
import { I18nProvider, type I18nProviderProps } from "@intl-party/react";

interface NextI18nConfig extends I18nConfig {
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

("use client");

export function AppI18nProvider({
  locale,
  config,
  translations,
  initialData,
  enableClientSideRouting = true,
  children,
  ...props
}: AppI18nProviderProps) {
  // Create i18n instance with preloaded translations
  const i18n = createI18n({
    ...config,
    // Override detection to use the provided locale
    detection: {
      strategies: enableClientSideRouting ? ["cookie", "localStorage"] : [],
    },
  });

  // Set the locale
  i18n.setLocale(locale);

  // Add translations for current locale if provided
  if (translations) {
    for (const [namespace, nsTranslations] of Object.entries(translations)) {
      i18n.addTranslations(locale, namespace, nsTranslations);
    }
  }

  // Add multi-locale translations for instant switching
  if (initialData) {
    for (const [targetLocale, localeData] of Object.entries(initialData)) {
      for (const [namespace, nsTranslations] of Object.entries(localeData)) {
        i18n.addTranslations(targetLocale, namespace, nsTranslations);
      }
    }
  }

  return (
    <I18nProvider {...props} i18n={i18n} initialLocale={locale}>
      {children}
    </I18nProvider>
  );
}

// Hook for loading translations in app router
export function useAppTranslations(
  locale: Locale,
  namespaces: string[],
  loadTranslations: (
    locale: Locale,
    namespace: string,
  ) => Promise<Record<string, any>>,
) {
  // This would typically be implemented with React.cache() or similar
  // For now, it's a placeholder for the async translation loading pattern
  return {
    translations: {},
    isLoading: false,
    error: null,
  };
}

// Layout component for App Router
export interface I18nLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
  config: NextI18nConfig;
  loadTranslations?: (
    locale: Locale,
    namespace: string,
  ) => Promise<Record<string, any>>;
  namespaces?: string[];
}

export async function I18nLayout({
  children,
  params,
  config,
  loadTranslations,
  namespaces = ["common"],
}: I18nLayoutProps) {
  // This function should only be used in server components
  if (typeof window !== "undefined") {
    throw new Error("I18nLayout must be used in a Server Component");
  }

  const { getLocaleFromParams } = await import("../server/index");
  const locale = getLocaleFromParams(params, config);

  // Load translations for server-side rendering
  const translations: Record<string, any> = {};

  if (loadTranslations) {
    for (const namespace of namespaces) {
      try {
        translations[namespace] = await loadTranslations(locale, namespace);
      } catch (error) {
        console.warn(
          `Failed to load translations for ${locale}/${namespace}:`,
          error,
        );
        translations[namespace] = {};
      }
    }
  }

  return (
    <AppI18nProvider
      locale={locale}
      config={config}
      translations={translations}
    >
      {children}
    </AppI18nProvider>
  );
}

// Utility for generating static params
export function generateStaticParams(
  locales: Locale[],
): Array<{ locale: string }> {
  return locales.map((locale) => ({ locale }));
}

// Metadata generation helpers
export interface MetadataConfig {
  title?: Record<Locale, string>;
  description?: Record<Locale, string>;
  keywords?: Record<Locale, string[]>;
  openGraph?: {
    title?: Record<Locale, string>;
    description?: Record<Locale, string>;
    siteName?: Record<Locale, string>;
  };
  alternates?: {
    canonical?: (locale: Locale) => string;
    languages?: (locales: Locale[]) => Record<string, string>;
  };
}

export function generateMetadata(
  locale: Locale,
  config: MetadataConfig,
  allLocales: Locale[],
) {
  const metadata: any = {};

  if (config.title?.[locale]) {
    metadata.title = config.title[locale];
  }

  if (config.description?.[locale]) {
    metadata.description = config.description[locale];
  }

  if (config.keywords?.[locale]) {
    metadata.keywords = config.keywords[locale];
  }

  if (config.openGraph) {
    metadata.openGraph = {};

    if (config.openGraph.title?.[locale]) {
      metadata.openGraph.title = config.openGraph.title[locale];
    }

    if (config.openGraph.description?.[locale]) {
      metadata.openGraph.description = config.openGraph.description[locale];
    }

    if (config.openGraph.siteName?.[locale]) {
      metadata.openGraph.siteName = config.openGraph.siteName[locale];
    }
  }

  if (config.alternates) {
    metadata.alternates = {};

    if (config.alternates.canonical) {
      metadata.alternates.canonical = config.alternates.canonical(locale);
    }

    if (config.alternates.languages) {
      metadata.alternates.languages = config.alternates.languages(allLocales);
    }
  }

  return metadata;
}

// Server action for changing locale
export async function changeLocaleAction(
  locale: Locale,
  config: NextI18nConfig,
  redirectPath?: string,
) {
  const { redirect } = await import("next/navigation");
  const { cookies } = await import("next/headers");

  // Set locale cookie
  cookies().set(config.cookieName || "INTL_LOCALE", locale, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
  });

  // Redirect to the new locale
  if (redirectPath) {
    redirect(`/${locale}${redirectPath}`);
  } else {
    redirect(`/${locale}`);
  }
}

// HOC for pages that need locale
export function withLocale<P extends { params: { locale: string } }>(
  Component: React.ComponentType<P>,
  config: NextI18nConfig,
) {
  return async function LocalizedComponent(props: P) {
    // This HOC should only be used in server components
    if (typeof window !== "undefined") {
      throw new Error("withLocale must be used in a Server Component");
    }

    const { getLocaleFromParams } = await import("../server/index");
    const locale = getLocaleFromParams(props.params, config);

    return <Component {...props} locale={locale} />;
  };
}

// Link component that preserves locale
export interface LocalizedLinkProps {
  href: string;
  locale?: Locale;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function LocalizedLink({
  href,
  locale,
  children,
  ...props
}: LocalizedLinkProps) {
  // This would need access to current locale context
  // Implementation would depend on how locale is stored in the app

  return (
    <a href={locale ? `/${locale}${href}` : href} {...props}>
      {children}
    </a>
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
