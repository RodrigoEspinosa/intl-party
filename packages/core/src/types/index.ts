export type Locale = string;

export type Namespace = string;

export type TranslationKey = string;

export type TranslationValue = string | number | boolean | null | undefined;

export type NestedTranslations = {
  [key: string]: TranslationValue | NestedTranslations;
};

export type Translations = Record<
  TranslationKey,
  TranslationValue | NestedTranslations
>;

export type LocaleTranslations = Record<Namespace, Translations>;

export type AllTranslations = Record<Locale, LocaleTranslations>;

/**
 * Error context passed to the onError callback.
 */
export interface I18nError {
  code:
    | "INVALID_CONFIG"
    | "DETECTION_FAILED"
    | "LISTENER_ERROR"
    | "FORMAT_ERROR"
    | "STORAGE_ERROR";
  message: string;
  source: string;
  cause?: unknown;
}

/**
 * Error handler callback type.
 * Called when a recoverable error occurs instead of silently swallowing it.
 */
export type ErrorHandler = (error: I18nError) => void;

/**
 * Typed event map for I18n events.
 */
export interface I18nEventMap {
  localeChange: { locale: Locale; previousLocale: Locale };
  namespaceChange: { namespace: Namespace; previousNamespace: Namespace };
  translationsAdded: {
    locale: Locale;
    namespace: Namespace;
    translations: Translations;
  };
  translationsRemoved: { locale: Locale; namespace?: Namespace };
  translationsPreloading: { locales: Locale[]; namespaces: Namespace[] };
  translationsPreloaded: { locales: Locale[]; namespaces: Namespace[] };
}

export interface I18nConfig {
  locales: Locale[];
  defaultLocale: Locale;
  namespaces: Namespace[];
  fallbackChain?: Record<Locale, Locale>;
  detection?: LocaleDetectionConfig;
  validation?: ValidationConfig;
  cache?: CacheConfig;
  /**
   * Called when a recoverable error occurs (e.g., detection failure, listener error).
   * Defaults to console.warn in development, no-op in production.
   */
  onError?: ErrorHandler;
}

export interface LocaleDetectionConfig {
  strategies: DetectionStrategy[];
  storageKey?: string;
  cookieName?: string;
  headerName?: string;
  queryParamName?: string;
  pathSegment?: number;
  geographic?: GeographicConfig;
}

export type DetectionStrategy =
  | "localStorage"
  | "sessionStorage"
  | "cookie"
  | "acceptLanguage"
  | "geographic"
  | "queryParam"
  | "path"
  | "subdomain"
  | "custom";

export interface GeographicConfig {
  countryToLocale: Record<string, Locale>;
  fallback?: Locale;
}

export interface ValidationConfig {
  strict?: boolean;
  logMissing?: boolean;
  throwOnMissing?: boolean;
  validateFormats?: boolean;
}

export interface CacheConfig {
  maxSize?: number;
  ttl?: number;
  strategy?: "lru" | "fifo";
}

export interface TranslationOptions {
  fallback?: TranslationValue;
  interpolation?: Record<string, TranslationValue>;
  count?: number;
  context?: string;
  formatters?: Record<string, (value: any) => string>;
  namespace?: Namespace;
}

export type EventListener<T = unknown> = (data: T) => void;

export interface I18nInstance {
  t: TranslationFunction;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  getLocale: () => Locale;
  getNamespace: () => Namespace;
  setNamespace: (namespace: Namespace) => void;
  hasTranslation: (key: TranslationKey, namespace?: Namespace) => boolean;
  getTranslation: (
    key: TranslationKey,
    namespace?: Namespace,
  ) => TranslationValue | undefined;
  addTranslations: (
    locale: Locale,
    namespace: Namespace,
    translations: Translations,
  ) => void;
  removeTranslations: (locale: Locale, namespace?: Namespace) => void;
  validateTranslations: () => ValidationResult;
  createScopedTranslator: (namespace: Namespace) => TranslationFunction;
  on: <E extends keyof I18nEventMap>(
    event: E,
    listener: EventListener<I18nEventMap[E]>,
  ) => void;
  off: <E extends keyof I18nEventMap>(
    event: E,
    listener: EventListener<I18nEventMap[E]>,
  ) => void;
  getAvailableLocales: () => Locale[];
  getAvailableNamespaces: () => Namespace[];
  getFallbackChain: (locale?: Locale) => Locale[];
  detectLocale: (context?: Record<string, unknown>) => Locale;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (
    amount: number,
    currency: string,
    options?: Intl.NumberFormatOptions,
  ) => string;
  formatRelativeTime: (
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: Intl.RelativeTimeFormatOptions,
  ) => string;
  preloadTranslations: (
    locale: Locale | Locale[],
    namespace?: Namespace | Namespace[],
  ) => Promise<void>;
}

export type TranslationFunction = (
  key: TranslationKey,
  options?: TranslationOptions,
) => string;

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type:
    | "missing_key"
    | "missing_namespace"
    | "invalid_format"
    | "circular_reference";
  locale: Locale;
  namespace: Namespace;
  key: TranslationKey;
  message: string;
}

export interface ValidationWarning {
  type: "unused_key" | "inconsistent_format" | "long_text";
  locale: Locale;
  namespace: Namespace;
  key: TranslationKey;
  message: string;
}

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  region?: string;
  country?: string;
}

export interface FormatOptions {
  date?: Intl.DateTimeFormatOptions;
  number?: Intl.NumberFormatOptions;
  currency?: {
    currency: string;
    options?: Intl.NumberFormatOptions;
  };
  relative?: {
    numeric?: "always" | "auto";
    style?: "long" | "short" | "narrow";
  };
}

export type DeepKeyOf<T, Prefix extends string = ""> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends Record<string, any>
            ? DeepKeyOf<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
            : `${Prefix}${K}`
          : never;
      }[keyof T]
    : never;

export type TypedTranslationFunction<
  T extends Record<string, any> = Record<string, any>,
> = (key: DeepKeyOf<T>, options?: TranslationOptions) => string;

export interface TypedI18nInstance<
  T extends Record<string, any> = Record<string, any>,
> extends Omit<I18nInstance, "t"> {
  t: TypedTranslationFunction<T>;
}

/**
 * Configuration for message format handling.
 * Controls which message formats are enabled.
 */
export interface MessageFormatConfig {
  /** Enable ICU MessageFormat support (default: true) */
  icu?: boolean;
  /** Enable legacy {{variable}} format support (default: true) */
  legacy?: boolean;
  /** Maximum cache size for compiled ICU messages (default: 500) */
  cacheSize?: number;
}
