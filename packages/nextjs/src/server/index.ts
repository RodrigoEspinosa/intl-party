// Server-only functions (uses next/headers, next/navigation)
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { I18nConfig, Locale } from "@intl-party/core";
import { detectLocaleFromHeaders } from "../shared/detect";

export interface NextI18nConfig extends I18nConfig {
  cookieName?: string;
  headerName?: string;
  paramName?: string;
  pathSegment?: number;
  basePath?: string;
  notFoundBehavior?: "not-found" | "redirect" | "fallback";
  asyncTranslations?: boolean;
}

// Server component for locale detection. Uses the SAME detection helpers as
// the middleware (q-value/region-aware Accept-Language, escaped cookie name)
// so SSR and middleware agree on the locale for a given request.
export async function getLocale(config: NextI18nConfig): Promise<Locale> {
  const { locales, defaultLocale, cookieName, headerName } = config;

  // headers() returns a Promise in Next 15; awaiting the plain object on
  // Next 13/14 is a no-op, so this works across the supported peer range.
  const headersList = await headers();

  return detectLocaleFromHeaders(headersList, {
    locales,
    defaultLocale,
    cookieName,
    headerName,
  });
}

// Server component for getting locale from params
export function getLocaleFromParams(
  params: { locale?: string },
  config: NextI18nConfig
): Locale {
  const { locales, defaultLocale, notFoundBehavior = "not-found" } = config;

  if (!params.locale) {
    return defaultLocale;
  }

  if (!locales.includes(params.locale)) {
    if (notFoundBehavior === "not-found") {
      notFound();
    }
    return defaultLocale;
  }

  return params.locale;
}

// Server-side compatibility helpers
export async function setLocale(locale: string): Promise<void> {
  try {
    const { cookies } = await import("next/headers");

    // cookies() returns a Promise in Next 15 (no-op await on 13/14)
    const cookieStore = await cookies();
    cookieStore.set("INTL_LOCALE", locale, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // Fallback for environments where next/headers is not available
    if (typeof document !== "undefined") {
      document.cookie = `INTL_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    }
  }
}

// Server-side translation utilities
export {
  createServerTranslations,
  getServerTranslations,
  type ServerTranslationConfig,
} from "./translations";
import { getServerTranslations } from "./translations";

// Server utilities
export { detectAvailableNamespaces } from "./utils";

// Server-side useTranslations equivalent
export function useServerTranslations(
  locale: string,
  namespace?: string,
  messages?: Record<string, any>
): (key: string, options?: any) => string {
  return getServerTranslations(locale, namespace, undefined, messages);
}
