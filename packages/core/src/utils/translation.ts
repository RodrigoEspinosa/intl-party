import type {
  Locale,
  Namespace,
  TranslationKey,
  TranslationValue,
  Translations,
  TranslationOptions,
  NestedTranslations,
  AllTranslations,
} from "../types";
import {
  isICUFormat,
  formatICUMessage,
  clearICUCache,
} from "./icu-formatter";

/**
 * Creates a stable cache key from translation options.
 * Handles non-serializable values (functions, circular refs) and ensures
 * consistent key generation regardless of object property order.
 */
function createStableCacheKey(options: TranslationOptions | undefined): string {
  if (!options) {
    return "";
  }

  try {
    // Extract only the cacheable parts of options
    const cacheableOptions: Record<string, unknown> = {};

    // Include count if present
    if (options.count !== undefined) {
      cacheableOptions.count = options.count;
    }

    // Include fallback if present and serializable
    if (options.fallback !== undefined) {
      cacheableOptions.fallback = options.fallback;
    }

    // Include interpolation values (sorted keys for consistency)
    if (options.interpolation) {
      const sortedInterpolation: Record<string, unknown> = {};
      const keys = Object.keys(options.interpolation).sort();
      for (const key of keys) {
        const value = options.interpolation[key];
        // Only include serializable values
        if (typeof value !== "function" && typeof value !== "symbol") {
          sortedInterpolation[key] = value;
        }
      }
      if (Object.keys(sortedInterpolation).length > 0) {
        cacheableOptions.interpolation = sortedInterpolation;
      }
    }

    // Note: formatters are not cached as they contain functions
    // This is intentional - translations with custom formatters won't be cached

    if (Object.keys(cacheableOptions).length === 0) {
      return "";
    }

    // Create sorted JSON for consistent keys
    return JSON.stringify(cacheableOptions, Object.keys(cacheableOptions).sort());
  } catch {
    // If serialization fails (circular ref, etc.), return empty string
    // This means the translation won't be cached, which is safe
    return "";
  }
}

export interface TranslationStoreOptions {
  fallbackChain?: Record<Locale, Locale>;
  maxCacheSize?: number;
}

const DEFAULT_MAX_CACHE_SIZE = 1000;

export class TranslationStore {
  private translations: AllTranslations = {};
  private fallbackChain: Record<Locale, Locale> = {};
  private cache = new Map<string, string>();
  private maxCacheSize: number;

  constructor(options: TranslationStoreOptions | Record<Locale, Locale> = {}) {
    // Support both legacy signature (fallbackChain only) and new options object
    if (this.isLegacyOptions(options)) {
      this.fallbackChain = options;
      this.maxCacheSize = DEFAULT_MAX_CACHE_SIZE;
    } else {
      this.fallbackChain = options.fallbackChain ?? {};
      this.maxCacheSize = options.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE;
    }
  }

  private isLegacyOptions(
    options: TranslationStoreOptions | Record<Locale, Locale>,
  ): options is Record<Locale, Locale> {
    // If it has 'fallbackChain' or 'maxCacheSize', it's new options format
    // Otherwise, treat as legacy Record<Locale, Locale>
    return !("fallbackChain" in options || "maxCacheSize" in options);
  }

  addTranslations(
    locale: Locale,
    namespace: Namespace,
    translations: Translations,
  ): void {
    if (!this.translations[locale]) {
      this.translations[locale] = {};
    }

    this.translations[locale][namespace] = {
      ...this.translations[locale][namespace],
      ...translations,
    };

    this.clearCache();
  }

  getTranslation(
    key: TranslationKey,
    locale: Locale,
    namespace: Namespace,
    options?: TranslationOptions,
  ): string {
    const optionsKey = createStableCacheKey(options);
    const cacheKey = `${locale}:${namespace}:${key}:${optionsKey}`;

    // Skip cache for non-cacheable options (e.g., with custom formatters)
    const shouldCache = !options?.formatters;

    if (shouldCache && this.cache.has(cacheKey)) {
      // Move to end for LRU behavior
      const value = this.cache.get(cacheKey)!;
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, value);
      return value;
    }

    const result = this.resolveTranslation(key, locale, namespace, options);

    if (shouldCache) {
      // Evict oldest entries if at capacity
      while (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        } else {
          break;
        }
      }
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  private resolveTranslation(
    key: TranslationKey,
    locale: Locale,
    namespace: Namespace,
    options?: TranslationOptions,
  ): string {
    const locales = this.getLocaleChain(locale);

    for (const currentLocale of locales) {
      const translation = this.getNestedValue(
        this.translations[currentLocale]?.[namespace],
        key,
      );

      if (translation !== undefined) {
        return this.formatTranslation(translation, currentLocale, options);
      }
    }

    if (options?.fallback !== undefined) {
      return this.formatTranslation(options.fallback, locale, options);
    }

    return this.getMissingTranslationFallback(key, locale, namespace);
  }

  private getLocaleChain(locale: Locale): Locale[] {
    const chain: Locale[] = [locale];
    let current = locale;

    while (this.fallbackChain[current]) {
      current = this.fallbackChain[current];
      if (chain.includes(current)) break; // Prevent circular references
      chain.push(current);
    }

    return chain;
  }

  private getNestedValue(
    obj: Translations | undefined,
    path: string,
  ): TranslationValue | undefined {
    if (!obj || typeof obj !== "object") return undefined;

    const keys = path.split(".");
    let current: TranslationValue | NestedTranslations | Translations = obj;

    for (const key of keys) {
      if (
        current &&
        typeof current === "object" &&
        Object.prototype.hasOwnProperty.call(current, key)
      ) {
        current = (current as Record<string, TranslationValue | NestedTranslations>)[key];
      } else {
        return undefined;
      }
    }

    // At this point current should be a leaf value, not a nested object
    if (typeof current === "object" && current !== null) {
      return undefined;
    }

    return current as TranslationValue;
  }

  private formatTranslation(
    value: TranslationValue,
    locale: Locale,
    options?: TranslationOptions,
  ): string {
    let result = String(value ?? "");

    // Check if this is an ICU format message
    if (isICUFormat(result)) {
      // Build ICU values from options
      const icuValues: Record<string, TranslationValue> = {
        ...options?.interpolation,
      };

      // Add count to values if provided
      if (options?.count !== undefined) {
        icuValues.count = options.count;
      }

      result = formatICUMessage(result, locale, icuValues);
    } else {
      // Use legacy format handling
      if (options?.interpolation) {
        result = this.interpolate(result, options.interpolation);
      }

      if (options?.count !== undefined) {
        result = this.handlePluralization(result, options.count);
      }
    }

    if (options?.formatters) {
      result = this.applyFormatters(result, options.formatters);
    }

    return result;
  }

  private interpolate(
    text: string,
    variables: Record<string, TranslationValue>,
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined ? String(value) : match;
    });
  }

  private handlePluralization(text: string, count: number): string {
    const pluralRegex = /\{\{count\|([^}]+)\}\}/;
    const match = text.match(pluralRegex);

    if (!match) return text.replace(/\{\{count\}\}/g, String(count));

    const forms = match[1].split("|");
    let form: string | undefined;

    if (count === 0 && forms[2] !== undefined) {
      form = forms[2]; // zero form
    } else if (count === 1) {
      form = forms[0]; // singular
    } else {
      form = forms[1] ?? forms[0]; // plural or fallback to singular
    }

    // Fallback to count string if no valid form found
    if (form === undefined) {
      form = String(count);
    }

    return text
      .replace(pluralRegex, form)
      .replace(/\{\{count\}\}/g, String(count));
  }

  private applyFormatters(
    text: string,
    formatters: Record<string, (value: string) => string>,
  ): string {
    return text.replace(/\{\{(\w+):(\w+)\}\}/g, (match, value, formatter) => {
      const formatterFn = formatters[formatter];
      return formatterFn ? formatterFn(value) : match;
    });
  }

  private getMissingTranslationFallback(
    key: TranslationKey,
    locale: Locale,
    namespace: Namespace,
  ): string {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Missing translation: "${key}" in namespace "${namespace}" for locale "${locale}"`,
      );
    }

    return `[${namespace}:${key}]`;
  }

  hasTranslation(
    key: TranslationKey,
    locale: Locale,
    namespace: Namespace,
  ): boolean {
    const locales = this.getLocaleChain(locale);

    return locales.some((currentLocale) => {
      const translation = this.getNestedValue(
        this.translations[currentLocale]?.[namespace],
        key,
      );
      return translation !== undefined;
    });
  }

  getAllTranslations(): AllTranslations {
    return { ...this.translations };
  }

  getNamespaceTranslations(
    locale: Locale,
    namespace: Namespace,
  ): Translations | undefined {
    return this.translations[locale]?.[namespace];
  }

  removeTranslations(locale: Locale, namespace?: Namespace): void {
    if (namespace) {
      if (this.translations[locale]) {
        delete this.translations[locale][namespace];
      }
    } else {
      delete this.translations[locale];
    }

    this.clearCache();
  }

  private clearCache(): void {
    this.cache.clear();
    clearICUCache();
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }
}

export function createTranslationStore(
  options: TranslationStoreOptions | Record<Locale, Locale> = {},
): TranslationStore {
  return new TranslationStore(options);
}

// Keys that should never be merged to prevent prototype pollution
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: T,
): T {
  const result = { ...target };

  for (const key in source) {
    // Protect against prototype pollution attacks
    if (UNSAFE_KEYS.has(key)) {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === "object" &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

export function flattenTranslations(
  translations: NestedTranslations,
  prefix = "",
): Record<string, TranslationValue> {
  const result: Record<string, TranslationValue> = {};

  for (const [key, value] of Object.entries(translations)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenTranslations(value as NestedTranslations, fullKey),
      );
    } else {
      result[fullKey] = value as TranslationValue;
    }
  }

  return result;
}

export function unflattenTranslations(
  flat: Record<string, TranslationValue>,
): NestedTranslations {
  const result: NestedTranslations = {};

  for (const [key, value] of Object.entries(flat)) {
    const keys = key.split(".");
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== "object") {
        current[k] = {};
      }
      current = current[k] as NestedTranslations;
    }

    current[keys[keys.length - 1]] = value;
  }

  return result;
}
