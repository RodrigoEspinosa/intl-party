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
} from "./types";
import { TranslationStore } from "./utils/translation";
import { LocaleDetector, type DetectionContext } from "./detection";
import { TranslationValidator } from "./validation";

export class I18n implements I18nInstance {
  private store: TranslationStore;
  private detector: LocaleDetector;
  private validator: TranslationValidator;
  private config: I18nConfig;
  private currentLocale: Locale;
  private currentNamespace: Namespace;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(config: I18nConfig) {
    this.config = config;
    this.currentLocale = config.defaultLocale;
    this.currentNamespace = config.namespaces[0] || "common";

    this.store = new TranslationStore(config.fallbackChain);

    this.detector = new LocaleDetector(
      config.locales,
      config.defaultLocale,
      config.detection || { strategies: ["acceptLanguage"] },
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

  get locale(): Locale {
    return this.currentLocale;
  }

  get namespace(): Namespace {
    return this.currentNamespace;
  }

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

  setLocale(locale: Locale): void {
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

  setNamespace(namespace: Namespace): void {
    if (!this.config.namespaces.includes(namespace)) {
      throw new Error(`Namespace "${namespace}" is not supported`);
    }

    const previousNamespace = this.currentNamespace;
    this.currentNamespace = namespace;

    // Emit namespace change event
    this.emit("namespaceChange", { namespace, previousNamespace });
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  getNamespace(): Namespace {
    return this.currentNamespace;
  }

  hasTranslation(key: TranslationKey, namespace?: Namespace): boolean {
    const ns = namespace || this.currentNamespace;
    return this.store.hasTranslation(key, this.currentLocale, ns);
  }

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

  addTranslations(
    locale: Locale,
    namespace: Namespace,
    translations: Translations,
  ): void {
    this.store.addTranslations(locale, namespace, translations);
    this.emit("translationsAdded", { locale, namespace, translations });
  }

  removeTranslations(locale: Locale, namespace?: Namespace): void {
    this.store.removeTranslations(locale, namespace);
    this.emit("translationsRemoved", { locale, namespace });
  }

  validateTranslations(): ValidationResult {
    const translations = this.store.getAllTranslations();
    return this.validator.validate(
      translations,
      this.config.locales,
      this.config.namespaces,
    );
  }

  // Scoped translation function for specific namespace
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

  // Detect locale from context (useful for SSR)
  detectLocale(context?: DetectionContext): Locale {
    return this.detector.detect(context);
  }

  // Get available locales
  getAvailableLocales(): Locale[] {
    return [...this.config.locales];
  }

  // Get available namespaces
  getAvailableNamespaces(): Namespace[] {
    return [...this.config.namespaces];
  }

  // Get fallback chain for a locale
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

  // Event system
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  // Get runtime statistics
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

  // Create typed instance for better TypeScript support
  createTyped<T extends Record<string, any>>(): TypedI18nInstance<T> {
    return {
      ...this,
      t: this.t as TypedTranslationFunction<T>,
    };
  }

  // Preload translations for specific locales/namespaces
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

  // Format utilities
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(number);
  }

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

  // Dispose method for cleanup
  dispose(): void {
    this.eventListeners.clear();
    this.store = null as any;
    this.detector = null as any;
    this.validator = null as any;
  }
}

export function createI18n(config: I18nConfig): I18n {
  return new I18n(config);
}

// Factory function for typed instances
export function createTypedI18n<T extends Record<string, any>>(
  config: I18nConfig,
): TypedI18nInstance<T> {
  const i18n = new I18n(config);
  return i18n.createTyped<T>();
}
