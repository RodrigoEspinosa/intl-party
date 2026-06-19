import { match } from "@formatjs/intl-localematcher";
import type { Locale } from "@intl-party/core";

/**
 * Shared locale-detection helpers used by BOTH the middleware and the server
 * `getLocale` so the two never disagree about q-values, region matching, or
 * cookie/header names for the same request.
 */

export interface HeaderDetectionConfig {
  locales: Locale[];
  defaultLocale: Locale;
  /** Cookie that stores an explicit locale choice. Default: "INTL_LOCALE". */
  cookieName?: string;
  /** Custom header carrying an explicit locale. Default: "x-locale". */
  headerName?: string;
}

/** A minimal headers accessor compatible with Headers, Next's headers(), and Map. */
export interface HeadersLike {
  get(name: string): string | null | undefined;
}

const NO_MATCH = "\0no-match\0";

/**
 * Parses an Accept-Language header into locales ordered by descending quality.
 */
export function parseAcceptLanguage(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(",")
    .map((lang) => {
      const [locale, q] = lang.trim().split(";q=");
      return {
        locale: locale.trim(),
        quality: q ? parseFloat(q) : 1.0,
      };
    })
    .filter((item) => item.locale.length > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.locale);
}

/**
 * Matches an Accept-Language header against the supported locales using
 * q-values and region-aware lookup. Returns null when nothing matches (so
 * callers can fall through to other strategies rather than the default).
 */
export function matchAcceptLanguage(
  acceptLanguage: string | null | undefined,
  locales: Locale[],
  fallback?: Locale,
): Locale | null {
  if (!acceptLanguage) return fallback ?? null;
  try {
    const matched = match(
      parseAcceptLanguage(acceptLanguage),
      locales,
      NO_MATCH,
    );
    if (matched !== NO_MATCH) return matched;
  } catch {
    // Ignore parse errors
  }
  return fallback ?? null;
}

/**
 * Reads a named cookie from a Cookie header string. The name is regex-escaped
 * and anchored to a cookie boundary so "mylocale=" can't match "locale", and
 * the value is URL-decoded.
 */
export function readCookieFromHeader(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`));
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/**
 * Detects a locale from request headers alone (custom header → cookie →
 * Accept-Language). Shared by the server `getLocale` and used by the
 * middleware for the header portion of its detection chain.
 */
export function detectLocaleFromHeaders(
  headers: HeadersLike,
  config: HeaderDetectionConfig,
): Locale {
  const {
    locales,
    defaultLocale,
    cookieName = "INTL_LOCALE",
    headerName = "x-locale",
  } = config;

  // 1. Custom header (explicit override)
  const headerLocale = headers.get(headerName);
  if (headerLocale && locales.includes(headerLocale)) {
    return headerLocale;
  }

  // 2. Cookie (remembered choice)
  const cookieLocale = readCookieFromHeader(headers.get("cookie"), cookieName);
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 3. Accept-Language (q-value + region aware)
  const matched = matchAcceptLanguage(headers.get("accept-language"), locales);
  if (matched && locales.includes(matched)) {
    return matched;
  }

  return defaultLocale;
}
