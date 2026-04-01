import { useState, useEffect, type ReactNode } from "react";
import { I18nProvider, type I18nProviderProps } from "@intl-party/react";
import type { I18nConfig, Locale } from "@intl-party/core";

export interface ReactNativeI18nProviderProps extends Omit<I18nProviderProps, "initialLocale"> {
  /**
   * Async function to detect the initial locale (e.g., from AsyncStorage or device settings).
   * While resolving, the provider renders `loadingComponent` if provided, or nothing.
   */
  detectLocale?: () => Promise<Locale>;
  /**
   * Callback invoked when the locale changes, useful for persisting the choice.
   * Example: `(locale) => asyncStorageDetector.persist(locale)`
   */
  onLocaleChange?: (locale: Locale) => void;
  /** Locale to use while the async detection is resolving */
  fallbackLocale?: Locale;
  /** Component to show while detecting locale */
  loadingComponent?: ReactNode;
  children: ReactNode;
}

/**
 * React Native-compatible I18nProvider that supports async locale detection.
 *
 * Unlike the web provider, this does not rely on `typeof window === "undefined"`
 * for SSR detection since React Native has no server rendering by default.
 *
 * Usage:
 * ```tsx
 * const deviceDetector = createDeviceLocaleDetector({ ... });
 * const storageDetector = createAsyncStorageDetector({ ... });
 *
 * <ReactNativeI18nProvider
 *   config={i18nConfig}
 *   detectLocale={storageDetector.detect}
 *   onLocaleChange={storageDetector.persist}
 *   fallbackLocale="en"
 * >
 *   <App />
 * </ReactNativeI18nProvider>
 * ```
 */
export function ReactNativeI18nProvider({
  detectLocale,
  fallbackLocale,
  loadingComponent,
  onLocaleChange,
  config,
  children,
  ...rest
}: ReactNativeI18nProviderProps) {
  const [detectedLocale, setDetectedLocale] = useState<Locale | null>(
    detectLocale ? null : (fallbackLocale ?? (config as I18nConfig)?.defaultLocale ?? null)
  );

  useEffect(() => {
    if (!detectLocale) return;

    let cancelled = false;
    detectLocale().then((locale) => {
      if (!cancelled) {
        setDetectedLocale(locale);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [detectLocale]);

  if (detectedLocale === null) {
    return <>{loadingComponent ?? null}</>;
  }

  return (
    <I18nProvider
      config={config}
      initialLocale={detectedLocale}
      onLocaleChange={onLocaleChange}
      {...rest}
    >
      {children}
    </I18nProvider>
  );
}
