import type { Locale } from "@intl-party/core";

/** How locales appear in URLs. Shared by the middleware, setup, and Provider. */
export interface RoutingConfig {
  locales: Locale[];
  defaultLocale: Locale;
  localePrefix: "always" | "as-needed" | "never";
  basePath?: string;
}

/**
 * Returns `pathname` as it should look for `locale`:
 * - "never": unchanged
 * - "always": `/<locale>/...`
 * - "as-needed": `/<locale>/...`, except the default locale has no prefix
 *
 * Any existing locale prefix is replaced. `pathname` must not include the
 * basePath (as with `usePathname()` or Next's router).
 */
export function localizePath(
  pathname: string,
  locale: Locale,
  routing: RoutingConfig,
): string {
  if (routing.localePrefix === "never") return pathname;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && routing.locales.includes(segments[0])) {
    segments.shift();
  }
  const rest = segments.length > 0 ? `/${segments.join("/")}` : "";

  if (
    routing.localePrefix === "as-needed" &&
    locale === routing.defaultLocale
  ) {
    return rest || "/";
  }
  return `/${locale}${rest}`;
}

/**
 * Full-page navigation. A separate object so tests can stub it (jsdom can't
 * navigate). Used when the locale can't be stored in a cookie: changing only
 * the query string re-renders the page but not the root layout, which is
 * where the locale and messages are loaded.
 */
export const hardNavigation = {
  assign(url: string): void {
    window.location.assign(url);
  },
};
