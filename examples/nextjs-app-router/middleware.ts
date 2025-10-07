import { createI18nMiddleware } from "@intl-party/nextjs";

export const middleware = createI18nMiddleware({
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  localePrefix: "never",
  cookieName: "INTL_LOCALE",
  detectFromCookie: true,
  detectFromHeader: true,
  detectFromQuery: true,
  detectFromPath: false,
  redirectStrategy: "none",
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
