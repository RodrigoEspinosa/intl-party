import { describe, it, expect, vi } from "vitest";
import { createTranslationFunction, createClient } from "./runtime";

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

describe("createClient", () => {
  it("returns a usable bound translation function and its messages", () => {
    const messages = { greeting: "Hello", nested: { key: "Nested" } };
    const client = createClient("en" as any, messages);

    expect(client.locale).toBe("en");
    expect(client.messages).toBe(messages);
    // t is a callable translation function, not the factory
    expect(client.t("greeting" as any)).toBe("Hello");
    expect(client.t("nested.key" as any)).toBe("Nested");
  });

  it("does not resolve keys from the prototype chain", () => {
    const t = createTranslationFunction("en" as any, { greeting: "Hello" });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // "constructor" exists on Object.prototype but not in the data
    expect(t("constructor" as any)).toBe("constructor");
    consoleSpy.mockRestore();
  });
});
