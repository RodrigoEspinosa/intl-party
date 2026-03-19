import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  createI18n,
  type I18nConfig,
  type I18nInstance,
  type Locale,
  type Namespace,
  type TranslationFunction,
} from "@intl-party/core";

export interface I18nContextValue {
  i18n: I18nInstance;
  locale: Locale;
  namespace: Namespace;
  t: TranslationFunction;
  setLocale: (locale: Locale) => void;
  setNamespace: (namespace: Namespace) => void;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: ReactNode;
  config?: I18nConfig;
  i18n?: I18nInstance;
  initialLocale?: Locale;
  initialNamespace?: Namespace;
  loadingComponent?: ReactNode;
  fallbackComponent?: ReactNode;
  onLocaleChange?: (locale: Locale) => void;
  onNamespaceChange?: (namespace: Namespace) => void;
  onError?: (error: Error) => void;
}

export function I18nProvider({
  children,
  config,
  i18n: externalI18n,
  initialLocale,
  initialNamespace,
  loadingComponent,
  fallbackComponent,
  onLocaleChange,
  onNamespaceChange,
  onError,
}: I18nProviderProps) {
  // Create or use provided i18n instance
  const i18nInstance = useMemo(() => {
    if (externalI18n) {
      return externalI18n;
    }

    if (!config) {
      throw new Error(
        "Either config or i18n instance must be provided to I18nProvider",
      );
    }

    const instance = createI18n(config);

    // Set initial locale and namespace if provided
    if (initialLocale && config.locales.includes(initialLocale)) {
      instance.setLocale(initialLocale);
    }

    if (initialNamespace && config.namespaces.includes(initialNamespace)) {
      instance.setNamespace(initialNamespace);
    }

    return instance;
  }, [config, externalI18n, initialLocale, initialNamespace]);

  const [locale, setLocaleState] = useState<Locale>(i18nInstance.getLocale());
  const [namespace, setNamespaceState] = useState<Namespace>(
    i18nInstance.getNamespace(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle locale changes
  const handleLocaleChange = (newLocale: Locale) => {
    try {
      setIsLoading(true);
      i18nInstance.setLocale(newLocale);
      setLocaleState(newLocale);
      onLocaleChange?.(newLocale);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to change locale");
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle namespace changes
  const handleNamespaceChange = (newNamespace: Namespace) => {
    try {
      i18nInstance.setNamespace(newNamespace);
      setNamespaceState(newNamespace);
      onNamespaceChange?.(newNamespace);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to change namespace");
      setError(error);
      onError?.(error);
    }
  };

  // Listen to i18n instance events
  useEffect(() => {
    const handleLocaleChangeEvent = ({
      locale: newLocale,
    }: {
      locale: Locale;
    }) => {
      setLocaleState(newLocale);
      onLocaleChange?.(newLocale);
    };

    const handleNamespaceChangeEvent = ({
      namespace: newNamespace,
    }: {
      namespace: Namespace;
    }) => {
      setNamespaceState(newNamespace);
      onNamespaceChange?.(newNamespace);
    };

    const handleTranslationsPreloading = () => setIsLoading(true);
    const handleTranslationsPreloaded = () => setIsLoading(false);

    i18nInstance.on("localeChange", handleLocaleChangeEvent);
    i18nInstance.on("namespaceChange", handleNamespaceChangeEvent);
    i18nInstance.on("translationsPreloading", handleTranslationsPreloading);
    i18nInstance.on("translationsPreloaded", handleTranslationsPreloaded);

    return () => {
      i18nInstance.off("localeChange", handleLocaleChangeEvent);
      i18nInstance.off("namespaceChange", handleNamespaceChangeEvent);
      i18nInstance.off("translationsPreloading", handleTranslationsPreloading);
      i18nInstance.off("translationsPreloaded", handleTranslationsPreloaded);
    };
  }, [i18nInstance, onLocaleChange, onNamespaceChange]);

  // Create context value
  const contextValue = useMemo(
    (): I18nContextValue => ({
      i18n: i18nInstance,
      locale,
      namespace,
      t: i18nInstance.t,
      setLocale: handleLocaleChange,
      setNamespace: handleNamespaceChange,
      isLoading,
    }),
    [i18nInstance, locale, namespace, isLoading],
  );

  // Handle errors
  if (error && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  if (error) {
    throw error;
  }

  // Handle loading state
  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

// Hook to use I18n context
export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    // Check if we're in SSR environment
    if (typeof window === "undefined") {
      // During SSR, create a minimal fallback context to prevent errors
      const fallbackI18n = createI18n({
        locales: ["en"],
        defaultLocale: "en",
        namespaces: ["common"],
      });

      return {
        i18n: fallbackI18n,
        locale: "en",
        namespace: "common",
        t: fallbackI18n.t,
        setLocale: () => {},
        setNamespace: () => {},
        isLoading: false,
      };
    }

    throw new Error("useI18nContext must be used within an I18nProvider");
  }

  return context;
}

