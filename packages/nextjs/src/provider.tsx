/**
 * Main provider that auto-loads messages
 */

"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { I18nProvider, useTranslations } from "@intl-party/react";
import { createI18n } from "@intl-party/core";
import type { Locale, TranslationValue } from "@intl-party/core";

// Context for locale switching
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
} | null>(null);

interface ProviderProps {
  children: React.ReactNode;
  locale?: string;
  defaultLocale?: string;
  initialMessages?: Record<string, Record<string, any>>;
}

/**
 * Main provider that auto-loads messages from generated location
 */
export function Provider({
  children,
  locale: propLocale,
  defaultLocale = "en",
  initialMessages = {},
}: ProviderProps) {
  const [locale, setLocale] = useState<Locale>(
    (propLocale as Locale) || defaultLocale
  );
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect locale from URL if not provided
  useEffect(() => {
    if (!propLocale && typeof window !== "undefined") {
      // Extract locale from URL path
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      const potentialLocale = pathSegments[0];

      // Try to detect from cookie
      const cookieLocale = document.cookie
        .split("; ")
        .find((row) => row.startsWith("INTL_LOCALE="))
        ?.split("=")[1];

      if (cookieLocale) {
        setLocale(cookieLocale as Locale);
      } else if (potentialLocale) {
        setLocale(potentialLocale as Locale);
      } else {
        setLocale(defaultLocale as Locale);
      }
    }
  }, [propLocale, defaultLocale]);

  // Set initial messages
  useEffect(() => {
    if (Object.keys(initialMessages).length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Handle locale switching
  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);

    // Update cookie
    if (typeof document !== "undefined") {
      document.cookie = `INTL_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    }

    // Update the i18n instance locale
    if (i18nInstance) {
      i18nInstance.setLocale(newLocale);
    }
  };

  // Create i18n instance
  const i18nInstance = useMemo(() => {
    // Get all available locales from messages
    const availableLocales = Object.keys(messages);
    const allLocales =
      availableLocales.length > 0 ? (availableLocales as Locale[]) : [locale];

    const instance = createI18n({
      locales: allLocales,
      defaultLocale: locale,
      namespaces: ["common"],
    });

    // Add loaded messages for all locales
    Object.entries(messages).forEach(([targetLocale, localeMessages]) => {
      Object.entries(localeMessages).forEach(
        ([namespace, namespaceMessages]) => {
          instance.addTranslations(
            targetLocale as Locale,
            namespace,
            namespaceMessages
          );
        }
      );
    });

    // Set current locale
    instance.setLocale(locale);

    return instance;
  }, [locale, messages]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleLocaleChange }}>
      <I18nProvider i18n={i18nInstance}>{children}</I18nProvider>
    </LocaleContext.Provider>
  );
}

/**
 * Hook for using translations
 */
export function useZeroTranslations(namespace?: string) {
  const t = useTranslations(namespace);

  // Return a namespaced translation function if namespace is provided
  if (namespace) {
    return (key: string, params?: Record<string, any>) => {
      return t(key, { interpolation: params });
    };
  }

  // Return default translation function
  return (key: string, params?: Record<string, any>) => {
    return t(key, { interpolation: params });
  };
}

/**
 * Hook for locale management
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a Provider");
  }
  return [context.locale, context.setLocale] as const;
}
