import { describe, it, expect } from "vitest";
import plugin from "./index";

describe("ESLint Plugin", () => {
  it("should export plugin configuration", () => {
    expect(plugin).toBeDefined();
    expect(plugin.meta).toBeDefined();
    expect(plugin.meta.name).toBe("@intl-party/eslint-plugin");
  });

  it("should export rules", () => {
    expect(plugin.rules).toBeDefined();
    expect(plugin.rules["no-hardcoded-strings"]).toBeDefined();
    expect(plugin.rules["no-missing-keys"]).toBeDefined();
    expect(plugin.rules["prefer-translation-hooks"]).toBeDefined();
  });

  it("should export configs", () => {
    expect(plugin.configs).toBeDefined();
    expect(plugin.configs.recommended).toBeDefined();
    expect(plugin.configs.strict).toBeDefined();
  });

  it("should export flat configs that reference the plugin", () => {
    const flatRecommended = plugin.configs["flat/recommended"] as {
      plugins: Record<string, unknown>;
      rules: Record<string, unknown>;
    };
    expect(flatRecommended.plugins["@intl-party"]).toBe(plugin);
    expect(flatRecommended.rules["@intl-party/no-missing-keys"]).toBeDefined();

    const flatStrict = plugin.configs["flat/strict"] as {
      plugins: Record<string, unknown>;
      rules: Record<string, unknown>;
    };
    expect(flatStrict.plugins["@intl-party"]).toBe(plugin);
  });
});
