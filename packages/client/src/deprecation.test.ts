import { describe, it, expect, vi } from "vitest";
import { createClient, createTranslationFunction } from "./index";

describe("deprecated @intl-party/client", () => {
  it("warns once across APIs and still translates", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const t = createTranslationFunction("en", { hello: "Hello" });
    createClient("en", {});

    expect(t("hello")).toBe("Hello");
    const messages = warn.mock.calls.map(([m]) => String(m));
    expect(messages.filter((m) => m.includes("is deprecated"))).toHaveLength(1);
    expect(messages[0]).toContain("issues/80");

    warn.mockRestore();
  });
});
