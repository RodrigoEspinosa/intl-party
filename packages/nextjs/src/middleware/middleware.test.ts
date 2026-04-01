import { describe, it, expect } from "vitest";
import { createI18nMiddleware } from "./index";

const validConfig = {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
};

describe("createI18nMiddleware config validation", () => {
  it("accepts a valid minimal config", () => {
    expect(() => createI18nMiddleware(validConfig)).not.toThrow();
  });

  // --- locales ---

  it("throws when locales is an empty array", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, locales: [] }),
    ).toThrow("Invalid config: `locales` must be a non-empty array");
  });

  it("throws when locales is not an array", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, locales: "en" as any }),
    ).toThrow("Invalid config: `locales` must be a non-empty array");
  });

  // --- defaultLocale ---

  it("throws when defaultLocale is not in locales", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, defaultLocale: "de" }),
    ).toThrow(
      'Invalid config: `defaultLocale` "de" is not in `locales`',
    );
  });

  // --- excludePaths ---

  it("throws when excludePaths is not an array of strings", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, excludePaths: [123 as any] }),
    ).toThrow("Invalid config: `excludePaths` must be an array of strings");
  });

  it("throws when excludePaths is not an array", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, excludePaths: "/api" as any }),
    ).toThrow("Invalid config: `excludePaths` must be an array of strings");
  });

  it("accepts valid excludePaths", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, excludePaths: ["/api", "/_next"] }),
    ).not.toThrow();
  });

  // --- includePaths ---

  it("throws when includePaths is not an array of strings", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, includePaths: [42 as any] }),
    ).toThrow("Invalid config: `includePaths` must be an array of strings");
  });

  it("throws when includePaths is not an array", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, includePaths: "/app" as any }),
    ).toThrow("Invalid config: `includePaths` must be an array of strings");
  });

  it("accepts valid includePaths", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, includePaths: ["/app", "/dashboard"] }),
    ).not.toThrow();
  });

  // --- basePath ---

  it("throws when basePath does not start with /", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, basePath: "app" }),
    ).toThrow(
      'Invalid config: `basePath` must start with "/" and not end with "/"',
    );
  });

  it("throws when basePath ends with /", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, basePath: "/app/" }),
    ).toThrow(
      'Invalid config: `basePath` must start with "/" and not end with "/"',
    );
  });

  it("accepts an empty string basePath", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, basePath: "" }),
    ).not.toThrow();
  });

  it("accepts a valid basePath", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, basePath: "/app" }),
    ).not.toThrow();
  });

  // --- cookieName ---

  it("throws when cookieName is an empty string", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, cookieName: "" }),
    ).toThrow("Invalid config: `cookieName` must be a non-empty string");
  });

  it("throws when cookieName is not a string", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, cookieName: 123 as any }),
    ).toThrow("Invalid config: `cookieName` must be a non-empty string");
  });

  it("accepts a valid cookieName", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, cookieName: "MY_LOCALE" }),
    ).not.toThrow();
  });

  // --- headerName ---

  it("throws when headerName is an empty string", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, headerName: "" }),
    ).toThrow("Invalid config: `headerName` must be a non-empty string");
  });

  it("throws when headerName is not a string", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, headerName: 42 as any }),
    ).toThrow("Invalid config: `headerName` must be a non-empty string");
  });

  it("accepts a valid headerName", () => {
    expect(() =>
      createI18nMiddleware({ ...validConfig, headerName: "x-custom-locale" }),
    ).not.toThrow();
  });
});
