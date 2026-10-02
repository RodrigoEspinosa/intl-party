// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { withIntlPartyHotReload, withIntlParty } from "./webpack-plugin";

describe("deprecated next.config integration", () => {
  it("warns once per API and still returns a config", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const config = withIntlPartyHotReload({ reactStrictMode: true });
    withIntlPartyHotReload({});
    withIntlParty({}, { i18nConfig: { locales: ["en"], defaultLocale: "en" } });

    expect(config.reactStrictMode).toBe(true);
    const messages = warn.mock.calls.map(([m]) => String(m));
    expect(
      messages.filter((m) => m.includes("withIntlPartyHotReload")),
    ).toHaveLength(1);
    expect(
      messages.some((m) => m.includes("withIntlParty is deprecated")),
    ).toBe(true);
    expect(messages[0]).toContain("issues/41");

    warn.mockRestore();
  });
});
