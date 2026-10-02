import { describe, it, expect, vi } from "vitest";

// Mock next/server so NextResponse.redirect/rewrite return the URL they were
// given (real URL objects), letting us assert the constructed pathname.
// NextRequest keeps a real `url` (basePath included) while `nextUrl.pathname`
// is basePath-stripped, matching Next.js runtime behavior.
vi.mock("next/server", () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    next: vi.fn(() => ({ type: "next", cookies: { set: vi.fn() } })),
    redirect: vi.fn((url: URL) => ({
      type: "redirect",
      url,
      cookies: { set: vi.fn() },
    })),
    rewrite: vi.fn((url: URL) => ({
      type: "rewrite",
      url,
      cookies: { set: vi.fn() },
    })),
  },
}));

import { createI18nMiddleware } from "./index";

function makeRequest(fullUrl: string, strippedPathname: string) {
  const u = new URL(fullUrl);
  return {
    url: fullUrl,
    cookies: { get: vi.fn(() => undefined) },
    headers: { get: vi.fn(() => null), *[Symbol.iterator]() {} },
    nextUrl: {
      // Next strips basePath from nextUrl.pathname
      pathname: strippedPathname,
      searchParams: u.searchParams,
    },
  } as any;
}

describe("middleware basePath handling", () => {
  it("does not duplicate basePath when adding an always-prefix", () => {
    const middleware = createI18nMiddleware({
      locales: ["en", "es"],
      defaultLocale: "en",
      localePrefix: "always",
      basePath: "/base",
      // force detection to a non-default locale via cookie
      detectFromCookie: false,
      detectFromHeader: false,
      detectFromQuery: false,
      detectFromPath: true,
    });

    // No locale in the path yet → should redirect adding the prefix
    const res = middleware(makeRequest("https://x.com/base/about", "/about"));

    expect(res).toBeTruthy();
    expect((res as any).type).toBe("redirect");
    const pathname = (res as any).url.pathname as string;
    // Must be /base/en/about, never /base/en/base/about
    expect(pathname).toBe("/base/en/about");
    expect(pathname).not.toContain("/base/en/base");
  });

  it("strips the default-locale prefix without mangling basePath", () => {
    const middleware = createI18nMiddleware({
      locales: ["en", "es"],
      defaultLocale: "en",
      localePrefix: "as-needed",
      basePath: "/base",
      detectFromCookie: false,
      detectFromHeader: false,
      detectFromQuery: false,
      detectFromPath: true,
    });

    // /base/en/about (nextUrl stripped → /en/about): default locale present,
    // should redirect to remove it → /base/about
    const res = middleware(
      makeRequest("https://x.com/base/en/about", "/en/about"),
    );

    expect((res as any).type).toBe("redirect");
    expect((res as any).url.pathname).toBe("/base/about");
  });
});

describe("as-needed prefix routing", () => {
  const middleware = createI18nMiddleware({
    locales: ["en", "es"],
    defaultLocale: "en",
    localePrefix: "as-needed",
    detectFromCookie: false,
    detectFromHeader: false,
    detectFromQuery: false,
  });

  it("serves an unprefixed default-locale URL from the [locale] route", () => {
    const res = middleware(makeRequest("https://x.com/about", "/about")) as any;
    expect(res.type).toBe("rewrite");
    expect(res.url.pathname).toBe("/en/about");
  });

  it("rewrites the root to the default locale", () => {
    const res = middleware(makeRequest("https://x.com/", "/")) as any;
    expect(res.type).toBe("rewrite");
    expect(res.url.pathname).toBe("/en");
  });

  it("passes prefixed non-default URLs through", () => {
    const res = middleware(
      makeRequest("https://x.com/es/about", "/es/about"),
    ) as any;
    expect(res.type).toBe("next");
  });

  it("redirects a prefixed default-locale URL to the clean one", () => {
    const res = middleware(
      makeRequest("https://x.com/en/about", "/en/about"),
    ) as any;
    expect(res.type).toBe("redirect");
    expect(res.url.pathname).toBe("/about");
  });
});
