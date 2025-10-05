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

export class TranslationStore {
  private translations: AllTranslations = {};
  private fallbackChain: Record<Locale, Locale> = {};
  private cache = new Map<string, string>();

  constructor(fallbackChain: Record<Locale, Locale> = {}) {
    this.fallbackChain = fallbackChain;
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
    const cacheKey = `${locale}:${namespace}:${key}:${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = this.resolveTranslation(key, locale, namespace, options);
    this.cache.set(cacheKey, result);

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
        return this.formatTranslation(translation, options);
      }
    }

    if (options?.fallback !== undefined) {
      return this.formatTranslation(options.fallback, options);
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

  private getNestedValue(obj: any, path: string): TranslationValue | undefined {
    if (!obj || typeof obj !== "object") return undefined;

    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private formatTranslation(
    value: TranslationValue,
    options?: TranslationOptions,
  ): string {
    let result = String(value ?? "");

    if (options?.interpolation) {
      result = this.interpolate(result, options.interpolation);
    }

    if (options?.count !== undefined) {
      result = this.handlePluralization(result, options.count);
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
    let form: string;

    if (count === 0 && forms[2]) {
      form = forms[2]; // zero form
    } else if (count === 1) {
      form = forms[0]; // singular
    } else {
      form = forms[1] || forms[0]; // plural or fallback to singular
    }

    return text
      .replace(pluralRegex, form)
      .replace(/\{\{count\}\}/g, String(count));
  }

  private applyFormatters(
    text: string,
    formatters: Record<string, (value: any) => string>,
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
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: 1000, // TODO: Make configurable
    };
  }
}

export function createTranslationStore(
  fallbackChain: Record<Locale, Locale> = {},
): TranslationStore {
  return new TranslationStore(fallbackChain);
}

export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: T,
): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
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
