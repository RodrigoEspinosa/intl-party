import type { Locale, TranslationValue, MessageFormatConfig } from "../types";

/**
 * LRU Cache implementation for compiled ICU messages.
 * Keeps most recently used messages at the end, evicts from the beginning.
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 500) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // If key exists, delete it first to refresh position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      } else {
        // Safety break: if iterator returns undefined but size > 0,
        // avoid infinite loop (should never happen with Map)
        break;
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Global cache for compiled ICU messages
// Key format: `${locale}:${message}`
const icuMessageCache = new LRUCache<string, any>(500);

// Cached reference to IntlMessageFormat constructor
let IntlMessageFormat: any = null;
let icuLoadAttempted = false;

/**
 * Attempts to load the intl-messageformat library.
 * Returns true if available, false otherwise.
 */
export function loadICULibrary(): boolean {
  if (IntlMessageFormat !== null) {
    return true;
  }

  if (icuLoadAttempted) {
    return false;
  }

  icuLoadAttempted = true;

  try {
    // Dynamic require for the optional dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const lib = require("intl-messageformat");
    IntlMessageFormat = lib.IntlMessageFormat || lib.default || lib;
    return true;
  } catch {
    // intl-messageformat not installed - this is expected for users
    // who don't need ICU support
    return false;
  }
}

/**
 * Checks if the intl-messageformat library is available.
 */
export function isICULibraryAvailable(): boolean {
  return loadICULibrary();
}

/**
 * Regex patterns for detecting message format types.
 *
 * ICU MessageFormat uses patterns like:
 * - {name} - simple argument
 * - {count, number} - formatted argument
 * - {count, plural, one {# item} other {# items}} - plural
 * - {gender, select, male {He} female {She} other {They}} - select
 *
 * Legacy format uses:
 * - {{name}} - simple interpolation
 * - {{count|singular|plural}} - pluralization
 */

// ICU pattern: {var, type, ...} or just {var}
// Must contain comma for plural/select, or be a simple {var} placeholder
// Excludes double-brace legacy patterns
const ICU_PLURAL_SELECT_PATTERN = /\{[^{}]+,\s*(plural|select|selectordinal)\s*,/;
const ICU_SIMPLE_ARG_PATTERN = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/;
// Match typed arguments like {amount, number}, {date, date}, {date, date, long}
const ICU_TYPED_ARG_PATTERN = /\{[a-zA-Z_][a-zA-Z0-9_]*\s*,\s*(number|date|time|spellout|ordinal|duration)(\s*,\s*[^{}]+)?\}/;

// Legacy pattern: {{var}} or {{count|singular|plural}}
const LEGACY_INTERPOLATION_PATTERN = /\{\{[^}]+\}\}/;

/**
 * Detects if a message uses ICU MessageFormat syntax.
 *
 * ICU MessageFormat patterns include:
 * - Plural: {count, plural, one {# item} other {# items}}
 * - Select: {gender, select, male {He} female {She} other {They}}
 * - Number formatting: {amount, number, currency}
 * - Date/time: {date, date, long}
 *
 * @param text - The message text to check
 * @returns true if the message uses ICU format
 *
 * @example
 * ```typescript
 * isICUFormat('{count, plural, one {# item} other {# items}}'); // true
 * isICUFormat('{gender, select, male {He} female {She} other {They}}'); // true
 * isICUFormat('Hello {name}!'); // true (simple ICU argument)
 * isICUFormat('Hello {{name}}!'); // false (legacy format)
 * ```
 */
export function isICUFormat(text: string): boolean {
  if (typeof text !== "string") {
    return false;
  }

  // Check for legacy format first - if present, not ICU
  if (LEGACY_INTERPOLATION_PATTERN.test(text)) {
    return false;
  }

  // Check for ICU plural/select patterns
  if (ICU_PLURAL_SELECT_PATTERN.test(text)) {
    return true;
  }

  // Check for ICU typed arguments like {amount, number}
  if (ICU_TYPED_ARG_PATTERN.test(text)) {
    return true;
  }

  // Check for simple ICU arguments like {name}
  // Only consider it ICU if it's NOT a legacy pattern
  if (ICU_SIMPLE_ARG_PATTERN.test(text)) {
    return true;
  }

  return false;
}

/**
 * Detects if a message uses the legacy {{variable}} format.
 *
 * Legacy patterns include:
 * - Simple interpolation: {{name}}
 * - Pluralization: {{count|singular|plural}}
 * - Zero form: {{count|singular|plural|zero}}
 *
 * @param text - The message text to check
 * @returns true if the message uses legacy format
 *
 * @example
 * ```typescript
 * isLegacyFormat('Hello {{name}}!'); // true
 * isLegacyFormat('{{count|item|items}}'); // true
 * isLegacyFormat('Hello {name}!'); // false (ICU format)
 * ```
 */
export function isLegacyFormat(text: string): boolean {
  if (typeof text !== "string") {
    return false;
  }

  return LEGACY_INTERPOLATION_PATTERN.test(text);
}

/**
 * Detects the message format type.
 *
 * @param text - The message text to check
 * @returns 'icu' | 'legacy' | 'plain' indicating the detected format
 *
 * @example
 * ```typescript
 * detectMessageFormat('{count, plural, ...}'); // 'icu'
 * detectMessageFormat('Hello {{name}}!'); // 'legacy'
 * detectMessageFormat('Hello world!'); // 'plain'
 * ```
 */
export function detectMessageFormat(text: string): "icu" | "legacy" | "plain" {
  if (isLegacyFormat(text)) {
    return "legacy";
  }
  if (isICUFormat(text)) {
    return "icu";
  }
  return "plain";
}

/**
 * Formats a message using ICU MessageFormat.
 *
 * This function:
 * 1. Checks if intl-messageformat is available
 * 2. Uses an LRU cache to avoid re-compiling messages
 * 3. Compiles and formats the message with the provided values
 *
 * @param message - The ICU MessageFormat message string
 * @param locale - The locale to use for formatting
 * @param values - Values to interpolate into the message
 * @returns The formatted message string
 *
 * @example
 * ```typescript
 * // Plural
 * formatICUMessage(
 *   '{count, plural, one {# item} other {# items}}',
 *   'en',
 *   { count: 5 }
 * ); // "5 items"
 *
 * // Select
 * formatICUMessage(
 *   '{gender, select, male {He} female {She} other {They}}',
 *   'en',
 *   { gender: 'female' }
 * ); // "She"
 * ```
 */
export function formatICUMessage(
  message: string,
  locale: Locale,
  values: Record<string, TranslationValue> = {}
): string {
  // Check if ICU library is available
  if (!loadICULibrary()) {
    // Fallback: return message with simple {var} replacement
    return message.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, key) => {
      const value = values[key];
      return value !== undefined ? String(value) : match;
    });
  }

  // Create cache key
  const cacheKey = `${locale}:${message}`;

  // Check cache for compiled message
  let compiledMessage = icuMessageCache.get(cacheKey);

  if (!compiledMessage) {
    try {
      // Compile the message
      compiledMessage = new IntlMessageFormat(message, locale);
      icuMessageCache.set(cacheKey, compiledMessage);
    } catch (error) {
      // If compilation fails, return original message
      if (process.env.NODE_ENV === "development") {
        console.warn(`Failed to compile ICU message: "${message}"`, error);
      }
      return message;
    }
  }

  try {
    // Format the message with values
    const result = compiledMessage.format(values);
    // Handle array results (can happen with rich text)
    if (Array.isArray(result)) {
      return result.map(String).join("");
    }
    return String(result);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to format ICU message: "${message}"`, error);
    }
    return message;
  }
}

/**
 * Clears the ICU message cache.
 * Useful when translations are updated or for testing.
 */
export function clearICUCache(): void {
  icuMessageCache.clear();
}

/**
 * Gets the current ICU cache statistics.
 * Useful for monitoring and debugging.
 */
export function getICUCacheStats(): { size: number; maxSize: number } {
  return {
    size: icuMessageCache.size,
    maxSize: 500,
  };
}

// Re-export MessageFormatConfig from types
export type { MessageFormatConfig } from "../types";

/**
 * Default message format configuration.
 */
export const DEFAULT_MESSAGE_FORMAT_CONFIG: MessageFormatConfig = {
  icu: true,
  legacy: true,
  cacheSize: 500,
};
