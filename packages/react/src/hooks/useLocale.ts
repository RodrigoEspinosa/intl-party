import { useMemo } from "react";
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

