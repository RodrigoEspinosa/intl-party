import { useState, useEffect, type ReactNode } from "react";
import { I18nProvider, type I18nProviderProps } from "@intl-party/react";
import type { I18nConfig, Locale } from "@intl-party/core";

export interface ReactNativeI18nProviderProps extends Omit<
  I18nProviderProps,
  "initialLocale"
> {
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
  i18n,
  children,
  ...rest
}: ReactNativeI18nProviderProps) {
  const [detectedLocale, setDetectedLocale] = useState<Locale | null>(
    detectLocale
      ? null
      : (fallbackLocale ?? (config as I18nConfig)?.defaultLocale ?? null),
  );

  useEffect(() => {
    if (!detectLocale) return;

    let cancelled = false;
    // Wrap in Promise.resolve so a synchronous detector (e.g.
    // createDeviceLocaleDetector) works too, and always settle the loading
    // state — an unhandled rejection here would otherwise leave the app stuck
    // on the loading screen forever.
    Promise.resolve()
      .then(() => detectLocale())
      .then((locale) => {
        if (cancelled) return;
        // I18nProvider only applies `initialLocale` to instances it creates
        // from `config`, so a caller-supplied instance must be switched here —
        // before the provider mounts, so the detection result isn't reported
        // through onLocaleChange as if the user had picked it.
        if (i18n && i18n.getAvailableLocales().includes(locale)) {
          i18n.setLocale(locale);
        }
        setDetectedLocale(locale);
      })
      .catch(() => {
        if (!cancelled) {
          setDetectedLocale(
            fallbackLocale ?? (config as I18nConfig)?.defaultLocale ?? "en",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detectLocale, fallbackLocale, config, i18n]);

  if (detectedLocale === null) {
    return <>{loadingComponent ?? null}</>;
  }

  return (
    <I18nProvider
      config={config}
      i18n={i18n}
      initialLocale={detectedLocale}
      onLocaleChange={onLocaleChange}
      {...rest}
    >
      {children}
    </I18nProvider>
  );
}
