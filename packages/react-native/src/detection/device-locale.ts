import type { Locale } from "@intl-party/core";

export interface DeviceLocaleDetectorOptions {
  /** Supported locales to match against */
  supportedLocales: Locale[];
  /** Fallback locale if device locale is not supported */
  fallbackLocale: Locale;
}

/**
 * Creates a detection function that reads the device's preferred locale.
 *
 * Tries the following sources in order:
 * 1. expo-localization (if available)
 * 2. react-native-localize (if available)
 * 3. Falls back to the configured fallback locale
 *
 * Install one of the optional peer dependencies for device locale detection:
 * - `expo-localization` (recommended for Expo projects)
 * - `react-native-localize` (for bare React Native projects)
 */
export function createDeviceLocaleDetector(options: DeviceLocaleDetectorOptions) {
  const { supportedLocales, fallbackLocale } = options;

  return function detectDeviceLocale(): Locale {
    const deviceLocales = getDeviceLocales();

    for (const deviceLocale of deviceLocales) {
      // Exact match
      if (supportedLocales.includes(deviceLocale)) {
        return deviceLocale;
      }

      // Language-only match (e.g., "en-US" -> "en")
      const language = deviceLocale.split("-")[0];
      if (supportedLocales.includes(language)) {
        return language;
      }
    }

    return fallbackLocale;
  };
}

function getDeviceLocales(): string[] {
  // Try expo-localization
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const expoLocalization = require("expo-localization");
    if (expoLocalization.getLocales) {
      const locales = expoLocalization.getLocales();
      return locales.map((l: { languageTag: string }) => l.languageTag);
    }
    if (expoLocalization.locale) {
      return [expoLocalization.locale];
    }
  } catch {
    // expo-localization not available
  }

  // Try react-native-localize
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rnLocalize = require("react-native-localize");
    if (rnLocalize.getLocales) {
      const locales = rnLocalize.getLocales();
      return locales.map((l: { languageTag: string }) => l.languageTag);
    }
  } catch {
    // react-native-localize not available
  }

  return [];
}
