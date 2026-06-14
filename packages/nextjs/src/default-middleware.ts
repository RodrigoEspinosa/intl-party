/**
 * Prebuilt demo middleware singleton.
 *
 * This is a convenience export with a FIXED locale list. There is no runtime
 * auto-detection here — if your locales differ, build your own with
 * `createI18nMiddleware({ locales: [...] })` from "@intl-party/nextjs".
 */

import { createI18nMiddleware, createLocaleMatcher } from "./middleware/index";

// Default configuration (fixed demo locales — configure your own via the factory)
const defaultConfig = {
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  localePrefix: "never" as const,
  cookieName: "INTL_LOCALE",
  redirectStrategy: "none" as const,
  detectFromPath: false,
  detectFromCookie: true,
  detectFromHeader: true,
  detectFromQuery: true,
};

// Create middleware with default config
export const middleware = createI18nMiddleware(defaultConfig);

// Create matcher
export const config = {
  matcher: createLocaleMatcher({ locales: defaultConfig.locales }),
};
