import { useCallback, useMemo } from "react";
import { useI18nContext } from "../context/I18nContext";
import type { Locale } from "@intl-party/core";

// Hook for current locale
export function useLocale(): [Locale, (locale: Locale) => void] {
  const { locale, setLocale } = useI18nContext();

  return [locale, setLocale];
}

// Hook for locale information
export function useLocaleInfo() {
  const { locale, i18n } = useI18nContext();

  return useMemo(() => {
    const availableLocales = i18n.getAvailableLocales();
    const fallbackChain = i18n.getFallbackChain(locale);

    return {
      current: locale,
      available: availableLocales,
      fallbackChain,
      isRTL: isRTLLocale(locale),
      direction: isRTLLocale(locale) ? "rtl" : "ltr",
    };
  }, [locale, i18n]);
}

// Hook for locale switching with validation
export function useLocaleSwitch() {
  const { i18n, setLocale } = useI18nContext();

  const switchLocale = useCallback(
    (locale: Locale) => {
      const availableLocales = i18n.getAvailableLocales();

      if (!availableLocales.includes(locale)) {
        throw new Error(
          `Locale "${locale}" is not available. Available locales: ${availableLocales.join(", ")}`,
        );
      }

      setLocale(locale);
    },
    [i18n, setLocale],
  );

  const isLocaleAvailable = useCallback(
    (locale: Locale) => {
      return i18n.getAvailableLocales().includes(locale);
    },
    [i18n],
  );

  return {
    switchLocale,
    isLocaleAvailable,
    availableLocales: i18n.getAvailableLocales(),
  };
}

// Hook for browser locale detection
export function useBrowserLocale() {
  const { i18n } = useI18nContext();

  return useMemo(() => {
    if (typeof window === "undefined") return null;

    const detected = i18n.detectLocale({
      request: undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    return {
      detected,
      browser: navigator.language,
      supported: i18n.getAvailableLocales().includes(detected),
    };
  }, [i18n]);
}

// Hook for persisting locale preference
export function useLocalePreference() {
  const { locale, setLocale, i18n } = useI18nContext();

  const savePreference = useCallback(
    (newLocale: Locale) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("intl-party-locale", newLocale);
      }
      setLocale(newLocale);
    },
    [setLocale],
  );

  const loadPreference = useCallback(() => {
    if (typeof window === "undefined") return null;

    const saved = localStorage.getItem("intl-party-locale");
    if (saved && i18n.getAvailableLocales().includes(saved)) {
      return saved;
    }

    return null;
  }, [i18n]);

  const clearPreference = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("intl-party-locale");
    }
  }, []);

  return {
    current: locale,
    save: savePreference,
    load: loadPreference,
    clear: clearPreference,
  };
}

// Helper function to detect RTL locales
function isRTLLocale(locale: Locale): boolean {
  const rtlLocales = [
    "ar",
    "arc",
    "ckb",
    "dv",
    "fa",
    "ha",
    "he",
    "khw",
    "ks",
    "ku",
    "ps",
    "sd",
    "ur",
    "yi",
  ];

  const baseLocale = locale.split("-")[0];
  return rtlLocales.includes(baseLocale);
}

// Hook for RTL/LTR direction
export function useDirection(): "ltr" | "rtl" {
  const { locale } = useI18nContext();

  return useMemo(() => {
    return isRTLLocale(locale) ? "rtl" : "ltr";
  }, [locale]);
}

// Hook for locale-aware formatting
export function useFormatting() {
  const { i18n } = useI18nContext();

  return useMemo(
    () => ({
      formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) =>
        i18n.formatDate(date, options),
      formatNumber: (number: number, options?: Intl.NumberFormatOptions) =>
        i18n.formatNumber(number, options),
      formatCurrency: (
        amount: number,
        currency: string,
        options?: Intl.NumberFormatOptions,
      ) => i18n.formatCurrency(amount, currency, options),
      formatRelativeTime: (
        value: number,
        unit: Intl.RelativeTimeFormatUnit,
        options?: Intl.RelativeTimeFormatOptions,
      ) => i18n.formatRelativeTime(value, unit, options),
    }),
    [i18n],
  );
}
