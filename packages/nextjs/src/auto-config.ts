/**
 * Auto-configuration for IntlParty Next.js integration
 * Zero-config setup that detects everything from messages directory
 */

import * as path from "node:path";
import type { Locale } from "@intl-party/core";

// Loaded lazily so this module can be bundled without a static node:fs
// dependency leaking into client/edge bundles.
async function getFs() {
  return (await import("node:fs")).promises;
}

export interface AutoDetectedConfig {
  locales: Locale[];
  defaultLocale: Locale;
  namespaces: string[];
  messagesPath: string;
  cookieName: string;
  localePrefix: "never";
}

/**
 * Auto-detect locales from messages directory
 */
export async function detectLocales(
  messagesPath: string = "./messages"
): Promise<Locale[]> {
  const fullPath = path.resolve(process.cwd(), messagesPath);

  try {
    const fs = await getFs();
    const entries = await fs.readdir(fullPath);

    // Check each entry to see if it's a directory with JSON files
    const localePromises = entries.map(async (entry) => {
      try {
        const entryPath = path.join(fullPath, entry);
        const stat = await fs.stat(entryPath);

        if (!stat.isDirectory()) return null;

        // Check if directory has any JSON files
        const files = await fs.readdir(entryPath);
        const hasJsonFiles = files.some((file: string) =>
          file.endsWith(".json")
        );

        return hasJsonFiles ? entry : null;
      } catch {
        return null;
      }
    });

    const resolvedLocales = await Promise.all(localePromises);
    const validLocales = resolvedLocales.filter(
      (locale): locale is Locale => locale !== null
    );

    return validLocales.length > 0 ? validLocales : ["en"];
  } catch {
    return ["en"];
  }
}

/**
 * Auto-detect namespaces from first locale
 */
export async function detectNamespaces(
  locales: Locale[],
  messagesPath: string = "./messages"
): Promise<string[]> {
  const firstLocale = locales[0] || "en";
  const fullPath = path.resolve(process.cwd(), messagesPath, firstLocale);

  try {
    const fs = await getFs();
    const files = await fs.readdir(fullPath);
    const namespaces = files
      .filter((file: string) => file.endsWith(".json"))
      .map((file: string) => file.replace(".json", ""));

    return namespaces.length > 0 ? namespaces : ["common"];
  } catch {
    return ["common"];
  }
}

/**
 * Auto-detect configuration from messages directory
 */
export async function detectConfig(
  messagesPath: string = "./messages"
): Promise<AutoDetectedConfig> {
  const locales = await detectLocales(messagesPath);
  const namespaces = await detectNamespaces(locales, messagesPath);
  const defaultLocale = locales[0] || "en";

  return {
    locales,
    defaultLocale,
    namespaces,
    messagesPath,
    cookieName: "INTL_LOCALE",
    localePrefix: "never", // Clean URLs by default
  };
}

