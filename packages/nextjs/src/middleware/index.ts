import { NextRequest, NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import type { Locale } from "@intl-party/core";

export interface I18nMiddlewareConfig {
  locales: Locale[];
  defaultLocale: Locale;
  localePrefix?: "always" | "as-needed" | "never";
  domains?: Record<string, Locale>;
  cookieName?: string;
  headerName?: string;
  queryParamName?: string;
  redirectStrategy?: "redirect" | "rewrite" | "none";
  excludePaths?: string[];
  includePaths?: string[];
  detectFromPath?: boolean;
  detectFromDomain?: boolean;
  detectFromCookie?: boolean;
  detectFromHeader?: boolean;
  detectFromQuery?: boolean;
  pathSegment?: number;
  basePath?: string;
}

function validateMiddlewareConfig(config: I18nMiddlewareConfig): void {
  if (!Array.isArray(config.locales) || config.locales.length === 0) {
    throw new Error(
      "Invalid config: `locales` must be a non-empty array",
    );
  }

  if (!config.locales.includes(config.defaultLocale)) {
    throw new Error(
      `Invalid config: \`defaultLocale\` "${config.defaultLocale}" is not in \`locales\``,
    );
  }

  if (config.excludePaths !== undefined) {
    if (
      !Array.isArray(config.excludePaths) ||
      !config.excludePaths.every((p) => typeof p === "string")
    ) {
      throw new Error(
        "Invalid config: `excludePaths` must be an array of strings",
      );
    }
  }

  if (config.includePaths !== undefined) {
    if (
      !Array.isArray(config.includePaths) ||
      !config.includePaths.every((p) => typeof p === "string")
    ) {
      throw new Error(
        "Invalid config: `includePaths` must be an array of strings",
      );
    }
  }

  if (config.basePath !== undefined) {
    if (
      typeof config.basePath !== "string" ||
      (config.basePath !== "" &&
        (!config.basePath.startsWith("/") || config.basePath.endsWith("/")))
    ) {
      throw new Error(
        'Invalid config: `basePath` must start with "/" and not end with "/"',
      );
    }
  }

  if (config.cookieName !== undefined) {
    if (typeof config.cookieName !== "string" || config.cookieName === "") {
      throw new Error(
        "Invalid config: `cookieName` must be a non-empty string",
      );
    }
  }

  if (config.headerName !== undefined) {
    if (typeof config.headerName !== "string" || config.headerName === "") {
      throw new Error(
        "Invalid config: `headerName` must be a non-empty string",
      );
    }
  }
}

export function createI18nMiddleware(config: I18nMiddlewareConfig) {
  validateMiddlewareConfig(config);

  const {
    locales,
    defaultLocale,
    localePrefix = "as-needed",
    domains = {},
    cookieName = "INTL_LOCALE",
    headerName = "x-locale",
    queryParamName = "locale",
    redirectStrategy = "redirect",
    excludePaths = ["/api", "/_next", "/_vercel", "/favicon.ico"],
    includePaths = [],
    detectFromPath = true,
    detectFromDomain = true,
    detectFromCookie = true,
    detectFromHeader = true,
    detectFromQuery = true,
    pathSegment = 0,
    basePath = "",
  } = config;

  return function middleware(request: NextRequest): NextResponse | void {
    const { pathname, search } = request.nextUrl;
    const url = new URL(request.url);

    // Skip middleware for excluded paths
    if (shouldSkipPath(pathname, excludePaths, includePaths, basePath)) {
      return NextResponse.next();
    }

    // Detect locale from various sources
    const detectedLocale = detectLocale(request, {
      locales,
      defaultLocale,
      domains,
      cookieName,
      headerName,
      queryParamName,
      detectFromPath,
      detectFromDomain,
      detectFromCookie,
      detectFromHeader,
      detectFromQuery,
      pathSegment,
      basePath,
    });

    // Get current locale from path
    const pathLocale = getLocaleFromPath(
      pathname,
      locales,
      basePath,
      pathSegment,
    );

    // Determine the target locale
    const targetLocale = pathLocale || detectedLocale;

    // Handle locale prefix strategy
    if (localePrefix === "always") {
      return handleAlwaysPrefix(
        request,
        targetLocale,
        pathLocale,
        redirectStrategy,
        basePath,
      );
    } else if (localePrefix === "as-needed") {
      return handleAsNeededPrefix(
        request,
        targetLocale,
        pathLocale,
        defaultLocale,
        redirectStrategy,
        basePath,
      );
    } else if (localePrefix === "never") {
      return handleNeverPrefix(
        request,
        targetLocale,
        cookieName,
        redirectStrategy,
      );
    }

    return NextResponse.next();
  };
}

function detectLocale(
  request: NextRequest,
  config: {
    locales: Locale[];
    defaultLocale: Locale;
    domains: Record<string, Locale>;
    cookieName: string;
    headerName: string;
    queryParamName: string;
    detectFromPath: boolean;
    detectFromDomain: boolean;
    detectFromCookie: boolean;
    detectFromHeader: boolean;
    detectFromQuery: boolean;
    pathSegment: number;
    basePath: string;
  },
): Locale {
  const {
    locales,
    defaultLocale,
    domains,
    cookieName,
    headerName,
    queryParamName,
    detectFromPath,
    detectFromDomain,
    detectFromCookie,
    detectFromHeader,
    detectFromQuery,
    pathSegment,
    basePath,
  } = config;

  // 1. From query parameter
  if (detectFromQuery) {
    const queryLocale = request.nextUrl.searchParams.get(queryParamName);
    if (queryLocale && locales.includes(queryLocale)) {
      return queryLocale;
    }
  }

  // 2. From path
  if (detectFromPath) {
    const pathLocale = getLocaleFromPath(
      request.nextUrl.pathname,
      locales,
      basePath,
      pathSegment,
    );
    if (pathLocale) {
      return pathLocale;
    }
  }

  // 3. From domain
  if (detectFromDomain) {
    const hostname = request.nextUrl.hostname;
    const domainLocale = domains[hostname];
    if (domainLocale && locales.includes(domainLocale)) {
      return domainLocale;
    }
  }

  // 4. From custom header
  if (detectFromHeader) {
    const headerLocale = request.headers.get(headerName);
    if (headerLocale && locales.includes(headerLocale)) {
      return headerLocale;
    }
  }

  // 5. From cookie
  if (detectFromCookie) {
    const cookieLocale = request.cookies.get(cookieName)?.value;
    if (cookieLocale && locales.includes(cookieLocale)) {
      return cookieLocale;
    }
  }

  // 6. From Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    try {
      const matched = match(
        parseAcceptLanguage(acceptLanguage),
        locales,
        defaultLocale,
      );
      if (matched && locales.includes(matched)) {
        return matched;
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return defaultLocale;
}

function getLocaleFromPath(
  pathname: string,
  locales: Locale[],
  basePath: string,
  pathSegment: number,
): Locale | null {
  const pathWithoutBase = basePath ? pathname.slice(basePath.length) : pathname;
  const segments = pathWithoutBase.split("/").filter(Boolean);

  if (segments.length > pathSegment) {
    const potentialLocale = segments[pathSegment];
    if (locales.includes(potentialLocale)) {
      return potentialLocale;
    }
  }

  return null;
}

function handleAlwaysPrefix(
  request: NextRequest,
  targetLocale: Locale,
  pathLocale: Locale | null,
  redirectStrategy: string,
  basePath: string,
): NextResponse {
  if (!pathLocale) {
    // Redirect to add locale prefix
    const url = new URL(request.url);
    url.pathname = `${basePath}/${targetLocale}${url.pathname}`;

    if (redirectStrategy === "redirect") {
      return NextResponse.redirect(url);
    } else if (redirectStrategy === "rewrite") {
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

function handleAsNeededPrefix(
  request: NextRequest,
  targetLocale: Locale,
  pathLocale: Locale | null,
  defaultLocale: Locale,
  redirectStrategy: string,
  basePath: string,
): NextResponse {
  if (targetLocale === defaultLocale && pathLocale) {
    // Remove unnecessary default locale prefix
    const url = new URL(request.url);
    const pathWithoutBase = basePath
      ? url.pathname.slice(basePath.length)
      : url.pathname;
    const pathWithoutLocale =
      pathWithoutBase.slice(`/${pathLocale}`.length) || "/";
    url.pathname = `${basePath}${pathWithoutLocale}`;

    if (redirectStrategy === "redirect") {
      return NextResponse.redirect(url);
    }
  } else if (targetLocale !== defaultLocale && !pathLocale) {
    // Add non-default locale prefix
    const url = new URL(request.url);
    url.pathname = `${basePath}/${targetLocale}${url.pathname}`;

    if (redirectStrategy === "redirect") {
      return NextResponse.redirect(url);
    } else if (redirectStrategy === "rewrite") {
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

function handleNeverPrefix(
  request: NextRequest,
  targetLocale: Locale,
  cookieName: string,
  redirectStrategy: string,
): NextResponse {
  const response = NextResponse.next();

  // Store locale in cookie for server-side access
  response.cookies.set(cookieName, targetLocale, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
  });

  return response;
}

function shouldSkipPath(
  pathname: string,
  excludePaths: string[],
  includePaths: string[],
  basePath: string,
): boolean {
  const pathWithoutBase = basePath ? pathname.slice(basePath.length) : pathname;

  // If includePaths is specified, only process those paths
  if (includePaths.length > 0) {
    return !includePaths.some((path) => {
      if (path.endsWith("*")) {
        return pathWithoutBase.startsWith(path.slice(0, -1));
      }
      return pathWithoutBase === path || pathWithoutBase.startsWith(`${path}/`);
    });
  }

  // Otherwise, exclude specified paths
  return excludePaths.some((path) => {
    if (path.endsWith("*")) {
      return pathWithoutBase.startsWith(path.slice(0, -1));
    }
    return pathWithoutBase === path || pathWithoutBase.startsWith(`${path}/`);
  });
}

function parseAcceptLanguage(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(",")
    .map((lang) => {
      const [locale, q] = lang.trim().split(";q=");
      return {
        locale: locale.trim(),
        quality: q ? parseFloat(q) : 1.0,
      };
    })
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.locale);
}

// Utility function to create matcher for Next.js middleware
export function createLocaleMatcher(
  config: Pick<I18nMiddlewareConfig, "locales" | "basePath">,
) {
  const { locales, basePath = "" } = config;

  return [
    // Match all paths except those that should be excluded
    `${basePath}/((?!api|_next|_vercel|favicon.ico).*)`,
    // Also match root path
    basePath || "/",
  ];
}

// Example usage helper
export function createNextI18nConfig(config: I18nMiddlewareConfig) {
  return {
    middleware: createI18nMiddleware(config),
    matcher: createLocaleMatcher(config),
  };
}
