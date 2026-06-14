import type { Locale } from "@intl-party/core";
import { optionalRequire } from "../internal/optional-require";

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
  // The literal require(...) in each thunk lets Metro bundle these optional
  // native modules; optionalRequire adds a Node ESM fallback so detection
  // doesn't silently return [] under Expo web / Node ESM tooling.

  const expoLocalization = optionalRequire<{
    getLocales?: () => Array<{ languageTag: string }>;
    locale?: string;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  }>("expo-localization", () => require("expo-localization"));
  if (expoLocalization?.getLocales) {
    return expoLocalization.getLocales().map((l) => l.languageTag);
  }
  if (expoLocalization?.locale) {
    return [expoLocalization.locale];
  }

  const rnLocalize = optionalRequire<{
    getLocales?: () => Array<{ languageTag: string }>;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  }>("react-native-localize", () => require("react-native-localize"));
  if (rnLocalize?.getLocales) {
    return rnLocalize.getLocales().map((l) => l.languageTag);
  }

  return [];
}
