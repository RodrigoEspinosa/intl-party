import { describe, it, expect, vi } from "vitest";
import { createTranslationFunction } from "./runtime";

describe("createTranslationFunction", () => {
  it("should return the translated string for a valid key", () => {
    const messages = {
      greeting: "Hello",
      nested: {
        key: "Nested Value",
      },
    };
    const t = createTranslationFunction("en" as any, messages);

    expect(t("greeting" as any)).toBe("Hello");
    expect(t("nested.key" as any)).toBe("Nested Value");
  });

  it("should return the key if the translation is missing", () => {
    const messages = {
      greeting: "Hello",
    };
    const t = createTranslationFunction("en" as any, messages);
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(t("missing.key" as any)).toBe("missing.key");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should interpolate values correctly", () => {
    const messages = {
      welcome: "Welcome, {{name}}!",
    };
    const t = createTranslationFunction("en" as any, messages);

    expect(t("welcome" as any, { name: "World" })).toBe("Welcome, World!");
  });
});
