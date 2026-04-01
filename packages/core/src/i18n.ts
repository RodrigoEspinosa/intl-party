import type {
  I18nConfig,
  I18nInstance,
  TypedI18nInstance,
  Locale,
  Namespace,
  TranslationKey,
  TranslationValue,
  Translations,
  TranslationOptions,
  TranslationFunction,
  TypedTranslationFunction,
  ValidationResult,
  ErrorHandler,
  I18nError,
  I18nEventMap,
} from "./types";
import { TranslationStore } from "./utils/translation";
import { LocaleDetector, type DetectionContext } from "./detection";
import { TranslationValidator } from "./validation";

/**
 * Core I18n class that provides internationalization functionality.
 * This is the main entry point for the IntlParty library.
 *
 * @example
 * ```typescript
 * const i18n = new I18n({
 *   locales: ["en", "es", "fr"],
 *   defaultLocale: "en",
 *   namespaces: ["common", "navigation"]
 * });
 *
 * i18n.addTranslations("en", "common", {
 *   welcome: "Welcome to our app",
 *   greeting: "Hello {{name}}!"
 * });
 *
 * i18n.t("welcome"); // "Welcome to our app"
 * i18n.t("greeting", { interpolation: { name: "John" } }); // "Hello John!"
 * ```
 *
 * @implements {I18nInstance}
 */
export class I18n implements I18nInstance {
  /** Internal translation store that manages translation data */
  private store: TranslationStore;

  /** Locale detection utility for detecting user locale preferences */
  private detector: LocaleDetector;

  /** Translation validator for checking translation completeness and consistency */
  private validator: TranslationValidator;

  /** Configuration options for the I18n instance */
  private config: I18nConfig;

  /** Currently active locale */
  private currentLocale: Locale;

  /** Currently active namespace */
  private currentNamespace: Namespace;

  /** Error handler for recoverable errors */
  private onError: ErrorHandler;

  /** Event listener registry for I18n events */
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  /** Keys that must never appear in translation objects (prototype pollution) */
  private static readonly UNSAFE_KEYS = new Set([
    "__proto__",
    "constructor",
    "prototype",
  ]);

  /**
   * Creates a new I18n instance with the provided configuration.
   *
   * @param {I18nConfig} config - Configuration object for the I18n instance
   * @throws {Error} If the configuration is invalid
   */
  constructor(config: I18nConfig) {
    I18n.validateConfig(config);

    this.config = config;
    this.onError =
      config.onError ??
      (process.env.NODE_ENV === "development"
        ? (err) => console.warn(`[intl-party] ${err.code}: ${err.message}`)
        : () => {});
    this.currentLocale = config.defaultLocale;
    this.currentNamespace = config.namespaces[0] || "common";

    this.store = new TranslationStore(config.fallbackChain);

    this.detector = new LocaleDetector(
      config.locales,
      config.defaultLocale,
      config.detection || { strategies: ["acceptLanguage"] },
      this.onError,
    );

    this.validator = new TranslationValidator(config.validation);

    // Auto-detect locale on initialization
    if (config.detection?.strategies.length) {
      const detected = this.detector.detect();
      if (detected !== config.defaultLocale) {
        this.setLocale(detected);
      }
    }
  }

  /**
   * Validates I18n configuration and throws on invalid input.
   * Called automatically by the constructor.
   */
  private static validateConfig(config: I18nConfig): void {
    if (!config.locales || config.locales.length === 0) {
      throw new Error(
        "Invalid config: `locales` must be a non-empty array",
      );
    }

    for (const locale of config.locales) {
      if (typeof locale !== "string" || locale.trim() === "") {
        throw new Error(
          "Invalid config: `locales` must not contain empty strings",
        );
      }
    }

    if (!config.defaultLocale || config.defaultLocale.trim() === "") {
      throw new Error(
        "Invalid config: `defaultLocale` must be a non-empty string",
      );
    }

    if (!config.locales.includes(config.defaultLocale)) {
      throw new Error(
        `Invalid config: \`defaultLocale\` "${config.defaultLocale}" is not in \`locales\``,
      );
    }

    if (!config.namespaces || config.namespaces.length === 0) {
      throw new Error(
        "Invalid config: `namespaces` must be a non-empty array",
      );
    }

    for (const ns of config.namespaces) {
      if (typeof ns !== "string" || ns.trim() === "") {
        throw new Error(
          "Invalid config: `namespaces` must not contain empty strings",
        );
      }
    }

    // Validate fallback chain references only supported locales
    if (config.fallbackChain) {
      for (const [from, to] of Object.entries(config.fallbackChain)) {
        if (!config.locales.includes(from)) {
          throw new Error(
            `Invalid config: fallbackChain key "${from}" is not in \`locales\``,
          );
        }
        if (!config.locales.includes(to)) {
          throw new Error(
            `Invalid config: fallbackChain value "${to}" (for key "${from}") is not in \`locales\``,
          );
        }
      }
    }
  }

  /**
   * Gets the current active locale.
   *
   * @returns {Locale} The current locale code
   */
  get locale(): Locale {
    return this.currentLocale;
  }

  /**
   * Gets the current active namespace.
   *
   * @returns {Namespace} The current namespace
   */
  get namespace(): Namespace {
    return this.currentNamespace;
  }

  /**
   * Main translation function to retrieve translated strings.
   *
   * @param {TranslationKey} key - The translation key to look up
   * @param {TranslationOptions} [options] - Optional configuration for translation
   * @returns {string} The translated string, with interpolation applied if provided
   *
   * @example
   * ```typescript
   * // Simple usage
   * i18n.t("welcome"); // "Welcome!"
   *
   * // With interpolation
   * i18n.t("greeting", { interpolation: { name: "John" } }); // "Hello John!"
   *
   * // With namespace
   * i18n.t("title", { namespace: "homepage" }); // Uses homepage namespace
   * ```
   */
  t: TranslationFunction = (
    key: TranslationKey,
    options?: TranslationOptions,
  ): string => {
    const namespace = options?.namespace || this.currentNamespace;
    return this.store.getTranslation(
      key,
      this.currentLocale,
      namespace,
      options,
    );
  };

  /**
   * Changes the active locale for the I18n instance.
   *
   * @param {Locale} locale - The locale code to set as active
   * @throws {Error} If the locale is not in the configured list of supported locales
   *
   * @example
   * ```typescript
   * i18n.setLocale("fr"); // Switch to French
   * i18n.t("welcome"); // "Bienvenue!"
   * ```
   */
  setLocale(locale: Locale): void {
    if (typeof locale !== "string" || locale.trim() === "") {
      throw new Error("Locale must be a non-empty string");
    }

    if (!this.config.locales.includes(locale)) {
      throw new Error(`Locale "${locale}" is not supported`);
    }

    const previousLocale = this.currentLocale;
    this.currentLocale = locale;

    // Persist locale preference
    this.detector.setLocale(locale, true);

    // Emit locale change event
    this.emit("localeChange", { locale, previousLocale });
  }

  /**
   * Changes the active namespace for the I18n instance.
   *
   * @param {Namespace} namespace - The namespace to set as active
   * @throws {Error} If the namespace is not in the configured list of supported namespaces
   *
   * @example
   * ```typescript
   * i18n.setNamespace("navigation"); // Switch to navigation namespace
   * i18n.t("home"); // "Home" (from navigation namespace)
   * ```
   */
  setNamespace(namespace: Namespace): void {
    if (typeof namespace !== "string" || namespace.trim() === "") {
      throw new Error("Namespace must be a non-empty string");
    }

    if (!this.config.namespaces.includes(namespace)) {
      throw new Error(`Namespace "${namespace}" is not supported`);
    }

    const previousNamespace = this.currentNamespace;
    this.currentNamespace = namespace;

    // Emit namespace change event
    this.emit("namespaceChange", { namespace, previousNamespace });
  }

  /**
   * Gets the current active locale.
   *
   * @returns {Locale} The current locale code
   */
  getLocale(): Locale {
    return this.currentLocale;
  }

  /**
   * Gets the current active namespace.
   *
   * @returns {Namespace} The current namespace
   */
  getNamespace(): Namespace {
    return this.currentNamespace;
  }

  /**
   * Checks if a translation key exists in the current locale and namespace.
   *
   * @param {TranslationKey} key - The translation key to check
   * @param {Namespace} [namespace] - Optional namespace to check (defaults to current)
   * @returns {boolean} True if the translation exists, false otherwise
   *
   * @example
   * ```typescript
   * if (i18n.hasTranslation("welcome")) {
   *   // Translation exists
   * }
   * ```
   */
  hasTranslation(key: TranslationKey, namespace?: Namespace): boolean {
    const ns = namespace || this.currentNamespace;
    return this.store.hasTranslation(key, this.currentLocale, ns);
  }

  /**
   * Gets the raw translation value for a key without processing.
   *
   * @param {TranslationKey} key - The translation key to look up
   * @param {Namespace} [namespace] - Optional namespace (defaults to current)
   * @returns {TranslationValue | undefined} The raw translation value or undefined if not found
   *
   * @example
   * ```typescript
   * const rawValue = i18n.getTranslation("greeting");
   * // Might return: "Hello {{name}}!" without interpolation
   * ```
   */
  getTranslation(
    key: TranslationKey,
    namespace?: Namespace,
  ): TranslationValue | undefined {
    const ns = namespace || this.currentNamespace;
    try {
      const translation = this.store.getTranslation(
        key,
        this.currentLocale,
        ns,
      );
      return translation === `[${ns}:${key}]` ? undefined : translation;
    } catch {
      return undefined;
    }
  }

  /**
   * Adds translations to the store for a specific locale and namespace.
   *
   * @param {Locale} locale - The locale code for these translations
   * @param {Namespace} namespace - The namespace for these translations
   * @param {Translations} translations - Object containing translation key-value pairs
   *
   * @example
   * ```typescript
   * i18n.addTranslations("es", "common", {
   *   welcome: "Bienvenido",
   *   goodbye: "Adiós",
   *   greeting: "Hola {{name}}!"
   * });
   * ```
   */
  addTranslations(
    locale: Locale,
    namespace: Namespace,
    translations: Translations,
  ): void {
    const sanitized = I18n.sanitizeTranslations(translations);
    this.store.addTranslations(locale, namespace, sanitized);
    this.emit("translationsAdded", {
      locale,
      namespace,
      translations: sanitized,
    });
  }

  /**
   * Recursively strips unsafe keys (__proto__, constructor, prototype) from
   * translation objects to prevent prototype pollution.
   */
  private static sanitizeTranslations(obj: Translations): Translations {
    const result: Translations = {};
    for (const key of Object.keys(obj)) {
      if (I18n.UNSAFE_KEYS.has(key)) continue;
      const value = obj[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result[key] = I18n.sanitizeTranslations(
          value as Translations,
        );
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Removes translations for a specific locale and optional namespace.
   *
   * @param {Locale} locale - The locale code to remove translations from
   * @param {Namespace} [namespace] - Optional namespace (if not provided, removes all namespaces)
   *
   * @example
   * ```typescript
   * // Remove all Spanish translations for the "common" namespace
   * i18n.removeTranslations("es", "common");
   *
   * // Remove all Spanish translations across all namespaces
   * i18n.removeTranslations("es");
   * ```
   */
  removeTranslations(locale: Locale, namespace?: Namespace): void {
    this.store.removeTranslations(locale, namespace);
    this.emit("translationsRemoved", { locale, namespace });
  }

  /**
   * Validates all translations for completeness and consistency.
   *
   * @returns {ValidationResult} Validation result containing errors and warnings
   *
   * @example
   * ```typescript
   * const validation = i18n.validateTranslations();
   *
   * if (!validation.valid) {
   *   console.error(`Found ${validation.errors.length} errors`);
   *   console.warn(`Found ${validation.warnings.length} warnings`);
   * }
   * ```
   */
  validateTranslations(): ValidationResult {
    const translations = this.store.getAllTranslations();
    return this.validator.validate(
      translations,
      this.config.locales,
      this.config.namespaces,
    );
  }

  /**
   * Creates a translation function that's bound to a specific namespace.
   *
   * @param {Namespace} namespace - The namespace to bind the translator to
   * @returns {TranslationFunction} A translation function bound to the specified namespace
   *
   * @example
   * ```typescript
   * // Create a translator for the "errors" namespace
   * const errorT = i18n.createScopedTranslator("errors");
   *
   * // Use without specifying namespace
   * errorT("notFound"); // Returns translation from "errors" namespace
   * ```
   */
  createScopedTranslator(namespace: Namespace): TranslationFunction {
    return (key: TranslationKey, options?: TranslationOptions): string => {
      return this.store.getTranslation(
        key,
        this.currentLocale,
        namespace,
        options,
      );
    };
  }

  /**
   * Detects the user's locale from various sources (context).
   * Particularly useful for server-side rendering.
   *
   * @param {DetectionContext} [context] - Optional context for detection (headers, cookies, etc.)
   * @returns {Locale} The detected locale code
   *
   * @example
   * ```typescript
   * // Browser-side detection
   * const locale = i18n.detectLocale();
   *
   * // Server-side with request context
   * const locale = i18n.detectLocale({
   *   headers: { "accept-language": "fr,en;q=0.9" },
   *   cookies: { "INTL_LOCALE": "fr" }
   * });
   * ```
   */
  detectLocale(context?: DetectionContext): Locale {
    return this.detector.detect(context);
  }

  /**
   * Gets all configured locales available in the instance.
   *
   * @returns {Locale[]} Array of available locale codes
   *
   * @example
   * ```typescript
   * const locales = i18n.getAvailableLocales(); // ["en", "es", "fr"]
   * ```
   */
  getAvailableLocales(): Locale[] {
    return [...this.config.locales];
  }

  /**
   * Gets all configured namespaces available in the instance.
   *
   * @returns {Namespace[]} Array of available namespaces
   *
   * @example
   * ```typescript
   * const namespaces = i18n.getAvailableNamespaces(); // ["common", "navigation"]
   * ```
   */
  getAvailableNamespaces(): Namespace[] {
    return [...this.config.namespaces];
  }

  /**
   * Gets the fallback chain for a locale from the configuration.
   * Used for resolving missing translations across locales.
   *
   * @param {Locale} [locale] - Optional locale to get fallback chain for (defaults to current)
   * @returns {Locale[]} Array of locales in fallback order
   *
   * @example
   * ```typescript
   * // With fallbackChain: { "fr-CA": "fr", "fr": "en" }
   * i18n.getFallbackChain("fr-CA"); // ["fr-CA", "fr", "en"]
   * ```
   */
  getFallbackChain(locale?: Locale): Locale[] {
    const targetLocale = locale || this.currentLocale;
    const chain: Locale[] = [targetLocale];
    let current = targetLocale;

    while (this.config.fallbackChain?.[current]) {
      current = this.config.fallbackChain[current];
      if (chain.includes(current)) break; // Prevent circular references
      chain.push(current);
    }

    return chain;
  }

  /**
   * Registers an event listener for I18n events.
   *
   * @param {string} event - Event name to listen for (e.g., "localeChange", "translationsAdded")
   * @param {Function} listener - Callback function that will receive event data
   *
   * @example
   * ```typescript
   * // Listen for locale changes
   * i18n.on("localeChange", ({ locale, previousLocale }) => {
   *   console.log(`Locale changed from ${previousLocale} to ${locale}`);
   * });
   *
   * // Listen for translation additions
   * i18n.on("translationsAdded", ({ locale, namespace }) => {
   *   console.log(`Added translations for ${locale}:${namespace}`);
   * });
   * ```
   */
  on<E extends keyof I18nEventMap>(
    event: E,
    listener: (data: I18nEventMap[E]) => void,
  ): void {
    const key = event as string;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    this.eventListeners.get(key)!.add(listener as (data: unknown) => void);
  }

  /**
   * Removes an event listener previously registered with on().
   *
   * @param {string} event - Event name the listener was registered for
   * @param {Function} listener - The callback function to remove
   *
   * @example
   * ```typescript
   * // Define listener
   * const onLocaleChange = ({ locale }) => console.log(`Locale: ${locale}`);
   *
   * // Register listener
   * i18n.on("localeChange", onLocaleChange);
   *
   * // Remove listener when no longer needed
   * i18n.off("localeChange", onLocaleChange);
   * ```
   */
  off<E extends keyof I18nEventMap>(
    event: E,
    listener: (data: I18nEventMap[E]) => void,
  ): void {
    this.eventListeners
      .get(event as string)
      ?.delete(listener as (data: unknown) => void);
  }

  /**
   * Emits an event to all registered listeners.
   *
   * @private
   * @param {string} event - Event name to emit
   * @param {any} data - Data to pass to listeners
   */
  private emit<E extends keyof I18nEventMap>(
    event: E,
    data: I18nEventMap[E],
  ): void {
    this.eventListeners.get(event as string)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        this.onError({
          code: "LISTENER_ERROR",
          message: `Error in event listener for "${event as string}"`,
          source: `I18n.emit(${event as string})`,
          cause: error,
        });
      }
    });
  }

  /**
   * Gets runtime statistics about the I18n instance.
   * Useful for debugging and monitoring.
   *
   * @returns {Object} Object containing runtime statistics
   *
   * @example
   * ```typescript
   * const stats = i18n.getStats();
   * console.log(`Active locale: ${stats.locale}`);
   * console.log(`Available locales: ${stats.availableLocales}`);
   * ```
   */
  getStats() {
    return {
      locale: this.currentLocale,
      namespace: this.currentNamespace,
      availableLocales: this.config.locales.length,
      availableNamespaces: this.config.namespaces.length,
      cache: this.store.getCacheStats(),
      config: {
        fallbackChain: Object.keys(this.config.fallbackChain || {}).length,
        detectionStrategies: this.config.detection?.strategies.length || 0,
      },
    };
  }

  /**
   * Creates a typed instance with better TypeScript type checking.
   *
   * @template T - Type definition for your translation structure
   * @returns {TypedI18nInstance<T>} A typed I18n instance
   *
   * @example
   * ```typescript
   * // Define your translation structure
   * interface AppTranslations {
   *   common: {
   *     welcome: string;
   *     greeting: string;
   *   };
   *   navigation: {
   *     home: string;
   *     about: string;
   *   };
   * }
   *
   * // Create typed instance
   * const typedI18n = i18n.createTyped<AppTranslations>();
   *
   * // TypeScript will validate keys
   * typedI18n.t("common.welcome"); // ✅ Valid
   * typedI18n.t("invalid.key"); // ❌ TypeScript error
   * ```
   */
  createTyped<T extends Record<string, any>>(): TypedI18nInstance<T> {
    return {
      ...this,
      t: this.t as TypedTranslationFunction<T>,
    };
  }

  /**
   * Preloads translations for specific locales and namespaces.
   *
   * @param {Locale | Locale[]} locale - Locale(s) to preload
   * @param {Namespace | Namespace[]} [namespace] - Namespace(s) to preload (defaults to all)
   * @returns {Promise<void>} Promise that resolves when preloading is complete
   *
   * @example
   * ```typescript
   * // Preload French translations for common namespace
   * await i18n.preloadTranslations("fr", "common");
   *
   * // Preload multiple locales and namespaces
   * await i18n.preloadTranslations(["fr", "es"], ["common", "navigation"]);
   * ```
   */
  async preloadTranslations(
    locale: Locale | Locale[],
    namespace?: Namespace | Namespace[],
  ): Promise<void> {
    const locales = Array.isArray(locale) ? locale : [locale];
    const namespaces = namespace
      ? Array.isArray(namespace)
        ? namespace
        : [namespace]
      : this.config.namespaces;

    // This would typically load from external sources
    // For now, it's a placeholder for the preloading mechanism
    this.emit("translationsPreloading", { locales, namespaces });

    // Simulate async loading
    await new Promise((resolve) => setTimeout(resolve, 0));

    this.emit("translationsPreloaded", { locales, namespaces });
  }

  /**
   * Formats a date according to the current locale.
   *
   * @param {Date} date - The date to format
   * @param {Intl.DateTimeFormatOptions} [options] - Formatting options
   * @returns {string} The formatted date string
   *
   * @example
   * ```typescript
   * // Basic date formatting
   * i18n.formatDate(new Date()); // "1/6/2026"
   *
   * // With options
   * i18n.formatDate(new Date(), {
   *   weekday: 'long',
   *   year: 'numeric',
   *   month: 'long',
   *   day: 'numeric'
   * }); // "Tuesday, January 6, 2026"
   * ```
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * Formats a number according to the current locale.
   *
   * @param {number} number - The number to format
   * @param {Intl.NumberFormatOptions} [options] - Formatting options
   * @returns {string} The formatted number string
   *
   * @example
   * ```typescript
   * // Basic number formatting
   * i18n.formatNumber(1000000); // "1,000,000" in en-US
   *
   * // With options
   * i18n.formatNumber(1000000, {
   *   style: 'decimal',
   *   maximumFractionDigits: 2
   * }); // "1,000,000.00"
   * ```
   */
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(number);
  }

  /**
   * Formats a currency amount according to the current locale.
   *
   * @param {number} amount - The amount to format
   * @param {string} currency - The currency code (e.g., "USD", "EUR")
   * @param {Intl.NumberFormatOptions} [options] - Additional formatting options
   * @returns {string} The formatted currency string
   *
   * @example
   * ```typescript
   * // Basic currency formatting
   * i18n.formatCurrency(1000, "USD"); // "$1,000.00"
   * i18n.formatCurrency(1000, "EUR"); // "€1,000.00"
   *
   * // With options
   * i18n.formatCurrency(1000, "USD", {
   *   currencyDisplay: 'name',
   *   maximumFractionDigits: 0
   * }); // "1,000 US dollars"
   * ```
   */
  formatCurrency(
    amount: number,
    currency: string,
    options?: Intl.NumberFormatOptions,
  ): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: "currency",
      currency,
      ...options,
    }).format(amount);
  }

  /**
   * Formats a relative time value according to the current locale.
   *
   * @param {number} value - The relative time value (can be negative)
   * @param {Intl.RelativeTimeFormatUnit} unit - The time unit ('day', 'month', etc.)
   * @param {Intl.RelativeTimeFormatOptions} [options] - Formatting options
   * @returns {string} The formatted relative time string
   *
   * @example
   * ```typescript
   * // Basic relative time formatting
   * i18n.formatRelativeTime(-1, "day"); // "1 day ago"
   * i18n.formatRelativeTime(2, "month"); // "in 2 months"
   *
   * // With options
   * i18n.formatRelativeTime(3, "day", {
   *   numeric: "auto",
   *   style: "long"
   * }); // "in 3 days"
   * ```
   */
  formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: Intl.RelativeTimeFormatOptions,
  ): string {
    return new Intl.RelativeTimeFormat(this.currentLocale, options).format(
      value,
      unit,
    );
  }

  /**
   * Disposes of this I18n instance, freeing resources and removing listeners.
   * Call this method when you're done with the instance to prevent memory leaks.
   *
   * @example
   * ```typescript
   * // When you're done with the instance
   * i18n.dispose();
   * ```
   */
  dispose(): void {
    this.eventListeners.clear();
    this.store = null as any;
    this.detector = null as any;
    this.validator = null as any;
  }
}

/**
 * Creates a new I18n instance with the provided configuration.
 * This is the main factory function for creating I18n instances.
 *
 * @param {I18nConfig} config - Configuration object for the I18n instance
 * @returns {I18n} A new I18n instance
 *
 * @example
 * ```typescript
 * import { createI18n } from "@intl-party/core";
 *
 * const i18n = createI18n({
 *   locales: ["en", "fr", "es"],
 *   defaultLocale: "en",
 *   namespaces: ["common", "navigation"]
 * });
 *
 * i18n.addTranslations("en", "common", {
 *   welcome: "Welcome",
 *   hello: "Hello {{name}}!"
 * });
 *
 * const message = i18n.t("welcome"); // "Welcome"
 * ```
 */
export function createI18n(config: I18nConfig): I18n {
  return new I18n(config);
}

/**
 * Creates a typed I18n instance with better TypeScript type checking.
 * Use this when you want full type safety for your translation keys.
 *
 * @template T - Type definition for your translation structure
 * @param {I18nConfig} config - Configuration object for the I18n instance
 * @returns {TypedI18nInstance<T>} A typed I18n instance
 *
 * @example
 * ```typescript
 * import { createTypedI18n } from "@intl-party/core";
 *
 * // Define your translation structure
 * interface AppTranslations {
 *   common: {
 *     welcome: string;
 *     greeting: string;
 *   };
 *   navigation: {
 *     home: string;
 *     about: string;
 *   };
 * }
 *
 * const i18n = createTypedI18n<AppTranslations>({
 *   locales: ["en", "fr"],
 *   defaultLocale: "en",
 *   namespaces: ["common", "navigation"]
 * });
 *
 * i18n.t("common.welcome"); // TypeScript validates this key exists
 * i18n.t("invalid.key"); // TypeScript error
 * ```
 */
export function createTypedI18n<T extends Record<string, any>>(
  config: I18nConfig,
): TypedI18nInstance<T> {
  const i18n = new I18n(config);
  return i18n.createTyped<T>();
}
