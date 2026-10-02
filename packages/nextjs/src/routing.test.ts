import { describe, it, expect } from "vitest";
import { localizePath, type RoutingConfig } from "./routing";

const base = { locales: ["en", "es", "fr"], defaultLocale: "en" };

describe("localizePath", () => {
  const asNeeded: RoutingConfig = { ...base, localePrefix: "as-needed" };
  const always: RoutingConfig = { ...base, localePrefix: "always" };
  const never: RoutingConfig = { ...base, localePrefix: "never" };

  it("as-needed: prefixes non-default locales only", () => {
    expect(localizePath("/about", "es", asNeeded)).toBe("/es/about");
    expect(localizePath("/es/about", "fr", asNeeded)).toBe("/fr/about");
    expect(localizePath("/es/about", "en", asNeeded)).toBe("/about");
    expect(localizePath("/es", "en", asNeeded)).toBe("/");
    expect(localizePath("/", "es", asNeeded)).toBe("/es");
  });

  it("always: prefixes every locale", () => {
    expect(localizePath("/en/about", "es", always)).toBe("/es/about");
    expect(localizePath("/about", "en", always)).toBe("/en/about");
    expect(localizePath("/", "en", always)).toBe("/en");
  });

  it("never: leaves the path alone", () => {
    expect(localizePath("/about", "es", never)).toBe("/about");
  });

  it("doesn't mistake a non-locale first segment for a locale", () => {
    expect(localizePath("/english/page", "es", asNeeded)).toBe(
      "/es/english/page",
    );
  });
});
