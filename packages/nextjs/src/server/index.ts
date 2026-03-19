// Server-only functions (uses next/headers, next/navigation)
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { I18nConfig, Locale } from "@intl-party/core";

export interface NextI18nConfig extends I18nConfig {
  cookieName?: string;
  paramName?: string;
  pathSegment?: number;
  basePath?: string;
  notFoundBehavior?: "not-found" | "redirect" | "fallback";
  asyncTranslations?: boolean;
}

// Server component for locale detection
export async function getLocale(config: NextI18nConfig): Promise<Locale> {
  const { locales, defaultLocale, cookieName = "INTL_LOCALE" } = config;

  // Get headers for server-side detection
  const headersList = headers();
  const acceptLanguage = headersList.get("accept-language");
  const customLocaleHeader = headersList.get("x-locale");

  // Try to detect from custom header first
  if (customLocaleHeader && locales.includes(customLocaleHeader)) {
    return customLocaleHeader;
  }

  // Try to get from cookie
  const cookieHeader = headersList.get("cookie");
  if (cookieHeader && cookieName) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, value] = c.trim().split("=");
        return [key, value];
      })
    );
    const cookieLocale = cookies[cookieName];
    if (cookieLocale && locales.includes(cookieLocale)) {
      return cookieLocale;
    }
  }

  // Fallback to Accept-Language parsing
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim())
      .map((lang) => {
        // Handle language-region formats (en-US -> en)
        const [language] = lang.split("-");
        return language;
      });

    for (const lang of languages) {
      if (locales.includes(lang)) {
        return lang;
      }
    }
  }

  return defaultLocale;
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

    cookies().set("INTL_LOCALE", locale, {
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

// Server utilities
export { detectAvailableNamespaces } from "./utils";

// Server-side useTranslations equivalent
export function useServerTranslations(
  locale: string,
  namespace?: string,
  messages?: Record<string, any>
): (key: string, options?: any) => string {
  // Import here to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getServerTranslations } = require("./translations");
  return getServerTranslations(locale, namespace, undefined, messages);
}
