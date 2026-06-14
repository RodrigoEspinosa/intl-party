/**
 * Main Next.js i18n setup
 * Everything is auto-detected from your messages directory
 */

import { NextRequest } from "next/server";
import { createI18nMiddleware, createLocaleMatcher } from "./middleware/index";
import { loadMessagesForLocale } from "./messages";
import * as path from "node:path";

// Loaded lazily so this module can be bundled without a static node:fs
// dependency leaking into client/edge bundles.
async function getFs() {
  return (await import("node:fs")).promises;
}

export interface ZeroConfigResult {
  // Middleware
  middleware: (request: NextRequest) => Response | void;
  middlewareConfig: { matcher: string[] };

  // Server utilities
  getLocale: (request?: NextRequest) => Promise<string>;
  getMessages: (locale: string) => Promise<any>;

  // Detected configuration, for wiring the client Provider yourself.
  // The Provider is intentionally NOT returned here: it is a client
  // component and must come from "@intl-party/nextjs/client" to keep the
  // "use client" boundary intact. Compose it with getMessages, e.g.:
  //   const { getMessages, detectedConfig } = await createZeroConfigSetup();
  //   <Provider locale={locale} initialMessages={await getMessages(locale)}>
  detectedConfig: {
    locales: string[];
    defaultLocale: string;
    namespaces: string[];
  };
}

/**
 * Auto-detect locales from messages directory
 */
async function detectLocales(): Promise<string[]> {
  const messagesPath = path.join(process.cwd(), "messages");

  try {
    const fs = await getFs();
    const entries = await fs.readdir(messagesPath);

    // Check each entry
    const localePromises = entries.map(async (entry) => {
      try {
        const stat = await fs.stat(path.join(messagesPath, entry));
        if (!stat.isDirectory()) return null;

        // Check if directory has any JSON files
        const files = await fs.readdir(path.join(messagesPath, entry));
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
      (locale): locale is string => locale !== null
    );

    return validLocales.length > 0 ? validLocales : ["en"];
  } catch {
    return ["en"];
  }
}

/**
 * Auto-detect namespaces from first locale
 */
async function detectNamespaces(locales: string[]): Promise<string[]> {
  const messagesPath = path.join(process.cwd(), "messages");
  const firstLocale = locales[0] || "en";

  try {
    const fs = await getFs();
    const localePath = path.join(messagesPath, firstLocale);
    const files = await fs.readdir(localePath);
    const namespaces = files
      .filter((file: string) => file.endsWith(".json"))
      .map((file: string) => file.replace(".json", ""));

    return namespaces.length > 0 ? namespaces : ["common"];
  } catch {
    return ["common"];
  }
}

/**
 * Create zero-config Next.js i18n setup
 */
export async function createZeroConfigSetup(): Promise<ZeroConfigResult> {
  // Auto-detect everything
  const locales = await detectLocales();
  const namespaces = await detectNamespaces(locales);
  const defaultLocale = locales[0] || "en";

  // Create middleware
  const middleware = createI18nMiddleware({
    locales,
    defaultLocale,
    localePrefix: "never", // Clean URLs by default
    cookieName: "INTL_LOCALE",
    redirectStrategy: "none",
    detectFromPath: false,
    detectFromCookie: true,
    detectFromHeader: true,
    detectFromQuery: true,
  });

  // Create matcher
  const matcher = createLocaleMatcher();

  // Server utility to get locale
  const getLocale = async (request?: NextRequest): Promise<string> => {
    if (request) {
      // Try to get locale from request
      const cookieLocale = request.cookies.get("INTL_LOCALE")?.value;
      if (cookieLocale && locales.includes(cookieLocale)) {
        return cookieLocale;
      }

      const headerLocale = request.headers
        .get("accept-language")
        ?.split(",")[0]
        ?.split("-")[0];
      if (headerLocale && locales.includes(headerLocale)) {
        return headerLocale;
      }
    }

    return defaultLocale;
  };

  // Server utility to get messages
  const getMessages = async (locale: string) => {
    return loadMessagesForLocale(locale as any, {
      messagesPath: "./messages",
      namespaces,
    });
  };

  return {
    middleware,
    middlewareConfig: { matcher },
    getLocale,
    getMessages,
    detectedConfig: { locales, defaultLocale, namespaces },
  };
}
