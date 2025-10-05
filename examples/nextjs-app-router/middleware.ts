import { createI18nMiddleware } from "@intl-party/nextjs";

export const middleware = createI18nMiddleware({
  // Supported locales
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",

  // Cookie-only locale storage - no URL modification
  localePrefix: "never",

  // Cookie configuration
  cookieName: "INTL_LOCALE",

  // Enable cookie detection
  detectFromCookie: true,

  // Optional: Also detect from Accept-Language header as fallback
  detectFromHeader: true,

  // Optional: Allow query parameter override (e.g., ?locale=es)
  detectFromQuery: true,
  queryParamName: "locale",

  // Disable path-based detection since we're not using URL prefixes
  detectFromPath: false,

  // Strategy for handling locale changes
  redirectStrategy: "none", // Don't redirect, just set cookie

  // Paths to exclude from middleware
  excludePaths: ["/api", "/_next", "/_vercel", "/favicon.ico", "/robots.txt"],
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files
    // - Next.js internals
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
