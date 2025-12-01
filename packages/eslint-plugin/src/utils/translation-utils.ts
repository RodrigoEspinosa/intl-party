import fs from "node:fs/promises";
import path from "node:path";
import type { AllTranslations } from "@intl-party/core";

// Cache for loaded translations to avoid reloading on every file
const translationCache = new Map<
  string,
  {
    translations: AllTranslations;
    timestamp: number;
    locales: string[];
    namespaces: string[];
  }
>();

export interface TranslationUtilsOptions {
  configPath?: string;
  defaultLocale?: string;
  translationFiles?: string[];
  cacheTimeout?: number; // in milliseconds, default 5 minutes
}

export class TranslationUtils {
  private options: TranslationUtilsOptions;
  private cacheTimeout: number;

  constructor(options: TranslationUtilsOptions = {}) {
    this.options = {
      defaultLocale: "en",
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      ...options,
    };
    this.cacheTimeout = this.options.cacheTimeout!;
  }

  /**
   * Load translations from configuration or provided files
   */
  async loadTranslations(): Promise<AllTranslations> {
    const cacheKey = this.getCacheKey();
    const now = Date.now();

    // Check cache first
    const cached = translationCache.get(cacheKey);
    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.translations;
    }

    let translations: AllTranslations;

    try {
      // Try to load from config first
      translations = await this.loadFromConfig();
    } catch {
      // Fallback to provided translation files
      translations = await this.loadFromFiles();
    }

    // Update cache
    translationCache.set(cacheKey, {
      translations,
      timestamp: now,
      locales: Object.keys(translations),
      namespaces: this.extractNamespaces(translations),
    });

    return translations;
  }

  /**
   * Get all available translation keys for a specific locale and namespace
   */
  async getTranslationKeys(
    locale: string,
    namespace?: string
  ): Promise<Set<string>> {
    const translations = await this.loadTranslations();
    const keys = new Set<string>();

    if (namespace) {
      const namespaceTranslations = translations[locale]?.[namespace] || {};
      this.collectKeys(namespaceTranslations, "", keys);
    } else {
      // Collect keys from all namespaces
      const localeTranslations = translations[locale] || {};
      for (const nsTranslations of Object.values(localeTranslations)) {
        this.collectKeys(nsTranslations, "", keys);
      }
    }

    return keys;
  }

  /**
   * Check if a translation key exists
   */
  async hasTranslationKey(
    locale: string,
    key: string,
    namespace?: string
  ): Promise<boolean> {
    const keys = await this.getTranslationKeys(locale, namespace);
    return keys.has(key);
  }

  /**
   * Get all available locales
   */
  async getLocales(): Promise<string[]> {
    const translations = await this.loadTranslations();
    return Object.keys(translations);
  }

  /**
   * Get all available namespaces for a locale
   */
  async getNamespaces(locale: string): Promise<string[]> {
    const translations = await this.loadTranslations();
    return Object.keys(translations[locale] || {});
  }

  /**
   * Validate translation key format
   */
  isValidTranslationKey(key: string): boolean {
    // Check if key follows valid format (namespace.key or just key)
    return /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(key);
  }

  /**
   * Extract namespace from a translation key
   */
  extractNamespace(key: string): string | null {
    if (key.includes(".")) {
      return key.split(".")[0];
    }
    return null;
  }

  /**
   * Get the base key (without namespace) from a translation key
   */
  getBaseKey(key: string): string {
    if (key.includes(".")) {
      return key.split(".").slice(1).join(".");
    }
    return key;
  }

  private getCacheKey(): string {
    return `${this.options.configPath || "default"}-${this.options.defaultLocale}`;
  }

  private async loadFromConfig(): Promise<AllTranslations> {
    // This would integrate with the CLI config loader
    // For now, we'll implement a simplified version

    const configFiles = [
      this.options.configPath,
      "intl-party.config.js",
      "intl-party.config.ts",
      "intl-party.config.json",
    ].filter(Boolean);

    for (const configFile of configFiles) {
      if (configFile && (await this.pathExists(configFile))) {
        try {
          let config;

          if (configFile.endsWith(".json")) {
            const content = await fs.readFile(configFile, "utf-8");
            config = JSON.parse(content);
          } else {
            // For JS/TS files, we'd need to use dynamic import
            // This is a simplified version - in production, you'd want proper module loading
            delete require.cache[path.resolve(configFile)];
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            config = require(path.resolve(configFile));

            if (config.default) {
              config = config.default;
            }
          }

          return await this.loadFromConfigObject(config);
        } catch (error) {
          // Continue to next config file
          continue;
        }
      }
    }

    throw new Error("No valid configuration found");
  }

  private async loadFromConfigObject(
    config: Record<string, unknown>
  ): Promise<AllTranslations> {
    const {
      locales = ["en"],
      defaultLocale = "en",
      messages = "./messages",
    } = config as {
      locales?: string[];
      defaultLocale?: string;
      messages?: string;
    };
    const translations: AllTranslations = {};

    for (const locale of locales) {
      translations[locale] = {};

      // Try to find translation files
      const messagesPath =
        typeof messages === "string" ? messages : "./messages";

      if (await this.pathExists(messagesPath)) {
        const localePath = path.join(messagesPath, locale);

        if (await this.pathExists(localePath)) {
          const files = await fs.readdir(localePath);

          for (const file of files) {
            if (file.endsWith(".json")) {
              const namespace = path.basename(file, ".json");
              const filePath = path.join(localePath, file);

              try {
                const content = await this.readJson(filePath);
                translations[locale][namespace] = content as any;
              } catch {
                translations[locale][namespace] = {};
              }
            }
          }
        }
      }
    }

    return translations;
  }

  private async loadFromFiles(): Promise<AllTranslations> {
    const { translationFiles = [], defaultLocale = "en" } = this.options;

    if (translationFiles.length === 0) {
      // Try to auto-detect
      return await this.autoDetectTranslations();
    }

    const translations: AllTranslations = {};

    for (const filePath of translationFiles) {
      try {
        const content = await this.readJson(filePath);

        // Try to infer locale and namespace from file path
        const { locale, namespace } = this.parseFilePath(filePath);

        if (!translations[locale]) {
          translations[locale] = {};
        }

        translations[locale][namespace] = content as any;
      } catch {
        // Skip invalid files
        continue;
      }
    }

    return translations;
  }

  private async autoDetectTranslations(): Promise<AllTranslations> {
    const translations: AllTranslations = {};

    // Common translation directory patterns
    const commonPaths = [
      "messages",
      "locales",
      "i18n",
      "public/locales",
      "src/locales",
      "src/translations",
    ];

    for (const basePath of commonPaths) {
      if (await this.pathExists(basePath)) {
        try {
          const entries = await fs.readdir(basePath);

          for (const entry of entries) {
            const entryPath = path.join(basePath, entry);
            const stat = await fs.stat(entryPath);

            if (stat.isDirectory()) {
              // This is a locale directory
              const locale = entry;
              translations[locale] = {};

              const files = await fs.readdir(entryPath);

              for (const file of files) {
                if (file.endsWith(".json")) {
                  const namespace = path.basename(file, ".json");
                  const filePath = path.join(entryPath, file);

                  try {
                    const content = await this.readJson(filePath);
                    translations[locale][namespace] = content as any;
                  } catch {
                    translations[locale][namespace] = {};
                  }
                }
              }
            }
          }

          if (Object.keys(translations).length > 0) {
            break; // Found translations, stop looking
          }
        } catch {
          // Continue to next path
          continue;
        }
      }
    }

    return translations;
  }

  private parseFilePath(filePath: string): {
    locale: string;
    namespace: string;
  } {
    const parts = filePath.split(path.sep);
    const fileName = parts[parts.length - 1];
    const namespace = path.basename(fileName, ".json");

    // Try to find locale in path
    let locale = this.options.defaultLocale!;

    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i];
      // Simple heuristic: if it's a 2-letter code, it might be a locale
      if (/^[a-z]{2}(-[A-Z]{2})?$/.test(part)) {
        locale = part;
        break;
      }
    }

    return { locale, namespace };
  }

  private collectKeys(
    obj: Record<string, unknown>,
    prefix: string,
    keys: Set<string>
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        this.collectKeys(value as Record<string, unknown>, fullKey, keys);
      } else {
        keys.add(fullKey);
      }
    }
  }

  private extractNamespaces(translations: AllTranslations): string[] {
    const namespaces = new Set<string>();

    for (const localeTranslations of Object.values(translations)) {
      for (const namespace of Object.keys(localeTranslations)) {
        namespaces.add(namespace);
      }
    }

    return Array.from(namespaces);
  }

  /**
   * Clear the translation cache
   */
  clearCache(): void {
    translationCache.clear();
  }

  /**
   * Check if a path exists (replacement for fs-extra's pathExists)
   */
  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read and parse JSON file (replacement for fs-extra's readJson)
   */
  private async readJson(filePath: string): Promise<Record<string, unknown>> {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  }
}
