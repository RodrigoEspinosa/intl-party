import type { Locale } from "@intl-party/core";

export interface AsyncStorageDetectorOptions {
  /** Storage key for persisting locale preference. Defaults to "@intl-party/locale" */
  storageKey?: string;
  /** Supported locales to validate against */
  supportedLocales: Locale[];
  /** Fallback locale if stored value is invalid or missing */
  fallbackLocale: Locale;
}

const DEFAULT_STORAGE_KEY = "@intl-party/locale";

/**
 * Creates detection functions that persist and retrieve locale preference
 * from AsyncStorage.
 *
 * Requires `@react-native-async-storage/async-storage` to be installed.
 *
 * Returns an object with:
 * - `detect()` - Async function to read the stored locale
 * - `persist(locale)` - Async function to save the locale
 * - `clear()` - Async function to remove the stored locale
 */
export function createAsyncStorageDetector(options: AsyncStorageDetectorOptions) {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    supportedLocales,
    fallbackLocale,
  } = options;

  function getAsyncStorage() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("@react-native-async-storage/async-storage").default;
    } catch {
      throw new Error(
        "@react-native-async-storage/async-storage is required for locale persistence. " +
        "Install it with: npx expo install @react-native-async-storage/async-storage"
      );
    }
  }

  return {
    async detect(): Promise<Locale> {
      try {
        const storage = getAsyncStorage();
        const stored = await storage.getItem(storageKey);
        if (stored && supportedLocales.includes(stored)) {
          return stored;
        }
      } catch {
        // Storage not available or read failed
      }
      return fallbackLocale;
    },

    async persist(locale: Locale): Promise<void> {
      const storage = getAsyncStorage();
      await storage.setItem(storageKey, locale);
    },

    async clear(): Promise<void> {
      const storage = getAsyncStorage();
      await storage.removeItem(storageKey);
    },
  };
}
