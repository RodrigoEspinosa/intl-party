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
import { I18nProvider, useUntypedTranslations } from "@intl-party/react";
import { createI18n } from "@intl-party/core";
import { useRouter } from "next/navigation";
import { localizePath, type RoutingConfig } from "./routing";
import type {
  Locale,
  RegisteredNamespace,
  TranslationKeyFor,
} from "@intl-party/core";

// Context for locale switching
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
} | null>(null);

interface ProviderProps {
  children: React.ReactNode;
  /**
   * The locale resolved on the server (e.g. `await getLocale()`). When set,
   * the server is the source of truth: switching locale reloads the page's
   * server data so the new locale's messages arrive.
   */
  locale?: string;
  defaultLocale?: string;
  initialMessages?: Record<string, Record<string, any>>;
  /** URL settings from `createSetup()`; needed for locale-prefixed URLs. */
  routing?: RoutingConfig;
}

/**
 * Next's App Router instance, or null outside it (tests, the Pages Router).
 * useRouter() throws when no App Router is mounted.
 */
function useOptionalRouter(): ReturnType<typeof useRouter> | null {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

/**
 * Main provider that auto-loads messages from generated location
 */
export function Provider({
  children,
  locale: propLocale,
  defaultLocale = "en",
  initialMessages = {},
  routing,
}: ProviderProps) {
  const [locale, setLocale] = useState<Locale>(
    (propLocale as Locale) || defaultLocale,
  );
  const router = useOptionalRouter();

  // Follow the server when it renders a new locale (after a switch below)
  useEffect(() => {
    if (propLocale) setLocale(propLocale as Locale);
  }, [propLocale]);
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

  // Handle locale switching. Changing `locale` state rebuilds the i18n
  // instance (below) with the new locale included, so we don't call
  // setLocale on the current instance here — doing so would throw when the
  // target locale's messages haven't been loaded into it yet.
  const handleLocaleChange = (newLocale: Locale) => {
    // Update cookie
    if (typeof document !== "undefined") {
      document.cookie = `INTL_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    }

    // Server-driven: only the current locale's messages are loaded, so ask
    // the server for the new ones instead of rendering missing keys. With
    // locale-prefixed URLs, navigate to the new locale's URL; otherwise
    // re-render in place (the middleware reads the new cookie).
    if (propLocale && router) {
      if (routing && routing.localePrefix !== "never") {
        const { pathname, search, hash } = window.location;
        const basePath = routing.basePath ?? "";
        const path =
          basePath && pathname.startsWith(basePath)
            ? pathname.slice(basePath.length) || "/"
            : pathname;
        router.push(
          `${localizePath(path, newLocale, routing)}${search}${hash}`,
        );
      } else {
        router.refresh();
      }
      return;
    }

    setLocale(newLocale);
  };

  // Create i18n instance
  const i18nInstance = useMemo(() => {
    // Always include the current locale so switching to a locale whose
    // messages aren't loaded yet doesn't throw "unsupported locale".
    const allLocales = Array.from(
      new Set<Locale>([locale, ...(Object.keys(messages) as Locale[])]),
    );

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
            namespaceMessages,
          );
        },
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
 * Hook for using translations: `t(key, params)`. Keys are type-checked
 * against the namespace once IntlPartyRegister is augmented.
 */
export function useZeroTranslations<N extends RegisteredNamespace = never>(
  namespace?: N,
): (
  key: TranslationKeyFor<N>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>,
) => string {
  // Keys were already checked against N by this hook's signature.
  const t = useUntypedTranslations(namespace);

  return (key, params) => t(key, { interpolation: params });
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
