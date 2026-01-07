import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createI18nMiddleware } from "./index";
import { NextRequest, NextResponse } from "next/server";

vi.mock("next/server", () => {
  const mockCookies = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const mockHeaders = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const mockSearchParams = {
    get: vi.fn(),
  };

  const mockNextUrl = {
    pathname: "/",
    clone: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    searchParams: mockSearchParams,
  };

  const mockNextResponse = {
    cookies: {
      set: vi.fn(),
    },
    headers: {
      set: vi.fn(),
    },
  };

  return {
    NextRequest: vi.fn().mockImplementation((url) => ({
      url,
      cookies: mockCookies,
      headers: mockHeaders,
      nextUrl: { ...mockNextUrl },
    })),
    NextResponse: {
      next: vi.fn().mockImplementation(() => ({ ...mockNextResponse })),
      redirect: vi.fn().mockImplementation(() => ({
        url: "redirected",
        cookies: { set: vi.fn() },
      })),
    },
  };
});

describe("Next.js Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should detect locale from cookie", async () => {
    const mockConfig = {
      locales: ["en", "fr", "es"],
      defaultLocale: "en",
      localePrefix: "never" as const,
      cookieName: "TEST_LOCALE",
    };

    const middleware = createI18nMiddleware(mockConfig);

    const mockRequest = new NextRequest("https://example.com");
    vi.mocked(mockRequest.cookies.get).mockImplementation(() => ({
      name: "TEST_LOCALE",
      value: "fr",
    }));

    await middleware(mockRequest);

    expect(mockRequest.cookies.get).toHaveBeenCalledWith("TEST_LOCALE");
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("should detect locale from accept-language header", async () => {
    const mockConfig = {
      locales: ["en", "fr", "es"],
      defaultLocale: "en",
      localePrefix: "never" as const,
    };

    const middleware = createI18nMiddleware(mockConfig);

    const mockRequest = new NextRequest("https://example.com");
    vi.mocked(mockRequest.headers.get).mockImplementation(
      () => "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    );

    const response = await middleware(mockRequest);

    expect(mockRequest.headers.get).toHaveBeenCalledWith("accept-language");
    expect(NextResponse.next).toHaveBeenCalled();

    if (response) {
      expect(response.cookies.set).toHaveBeenCalledWith(
        expect.any(String),
        "fr",
        expect.anything(),
      );
    }
  });

  it("should detect locale from URL path when localePrefix is enabled", async () => {
    const mockConfig = {
      locales: ["en", "fr", "es"],
      defaultLocale: "en",
      localePrefix: "always" as const,
    };

    const middleware = createI18nMiddleware(mockConfig);

    const mockRequest = new NextRequest("https://example.com");
    mockRequest.nextUrl.pathname = "/fr/about";

    const response = await middleware(mockRequest);

    expect(NextResponse.next).toHaveBeenCalled();

    if (response) {
      expect(response.cookies.set).toHaveBeenCalledWith(
        expect.any(String),
        "fr",
        expect.anything(),
      );
    }
  });

  it("should redirect to locale prefix URL when localePrefix is 'always'", async () => {
    const mockConfig = {
      locales: ["en", "fr", "es"],
      defaultLocale: "en",
      localePrefix: "always" as const,
    };

    const middleware = createI18nMiddleware(mockConfig);

    const mockRequest = new NextRequest("https://example.com/about");
    mockRequest.nextUrl.pathname = "/about";
    vi.mocked(mockRequest.cookies.get).mockImplementation(() => ({
      name: "INTL_LOCALE",
      value: "fr",
    }));

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining("/fr/about"),
    );
  });

  it("should fallback to default locale when no locale is detected", async () => {
    const mockConfig = {
      locales: ["en", "fr", "es"],
      defaultLocale: "en",
      localePrefix: "never" as const,
    };

    const middleware = createI18nMiddleware(mockConfig);

    const mockRequest = new NextRequest("https://example.com");
    vi.mocked(mockRequest.headers.get).mockImplementation(() => null);

    const response = await middleware(mockRequest);

    expect(NextResponse.next).toHaveBeenCalled();

    if (response) {
      expect(response.cookies.set).toHaveBeenCalledWith(
        expect.any(String),
        "en",
        expect.anything(),
      );
    }
  });
});
