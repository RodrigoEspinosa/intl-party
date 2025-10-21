/**
 * Main middleware export
 */

import { createI18nMiddleware, createLocaleMatcher } from "./middleware/index";

// Default configuration
const defaultConfig = {
  locales: ["en", "es", "fr", "de"], // Will be auto-detected at runtime
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
