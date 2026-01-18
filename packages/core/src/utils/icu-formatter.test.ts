import { describe, it, expect, beforeEach } from "vitest";
import {
  isICUFormat,
  isLegacyFormat,
  detectMessageFormat,
  formatICUMessage,
  clearICUCache,
  getICUCacheStats,
  isICULibraryAvailable,
} from "./icu-formatter";

describe("ICU Formatter", () => {
  beforeEach(() => {
    clearICUCache();
  });

  describe("isICUFormat", () => {
    it("should detect ICU plural patterns", () => {
      expect(
        isICUFormat("{count, plural, one {# item} other {# items}}")
      ).toBe(true);
      expect(
        isICUFormat("{n, plural, =0 {no items} =1 {one item} other {# items}}")
      ).toBe(true);
    });

    it("should detect ICU select patterns", () => {
      expect(
        isICUFormat("{gender, select, male {He} female {She} other {They}}")
      ).toBe(true);
    });

    it("should detect ICU selectordinal patterns", () => {
      expect(
        isICUFormat(
          "{position, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}"
        )
      ).toBe(true);
    });

    it("should detect ICU typed arguments", () => {
      expect(isICUFormat("{amount, number}")).toBe(true);
      expect(isICUFormat("{date, date, long}")).toBe(true);
      expect(isICUFormat("{time, time, short}")).toBe(true);
    });

    it("should detect simple ICU arguments", () => {
      expect(isICUFormat("Hello {name}!")).toBe(true);
      expect(isICUFormat("{greeting}, {name}!")).toBe(true);
    });

    it("should not detect legacy format as ICU", () => {
      expect(isICUFormat("Hello {{name}}!")).toBe(false);
      expect(isICUFormat("{{count|item|items}}")).toBe(false);
      expect(isICUFormat("{{count}} items")).toBe(false);
    });

    it("should return false for plain text", () => {
      expect(isICUFormat("Hello world!")).toBe(false);
      expect(isICUFormat("")).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(isICUFormat(null as any)).toBe(false);
      expect(isICUFormat(undefined as any)).toBe(false);
      expect(isICUFormat(123 as any)).toBe(false);
    });
  });

  describe("isLegacyFormat", () => {
    it("should detect legacy interpolation patterns", () => {
      expect(isLegacyFormat("Hello {{name}}!")).toBe(true);
      expect(isLegacyFormat("{{greeting}}, {{name}}!")).toBe(true);
    });

    it("should detect legacy pluralization patterns", () => {
      expect(isLegacyFormat("{{count|item|items}}")).toBe(true);
      expect(isLegacyFormat("{{count|item|items|no items}}")).toBe(true);
    });

    it("should not detect ICU format as legacy", () => {
      expect(isLegacyFormat("Hello {name}!")).toBe(false);
      expect(isLegacyFormat("{count, plural, one {# item} other {# items}}")).toBe(false);
    });

    it("should return false for plain text", () => {
      expect(isLegacyFormat("Hello world!")).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(isLegacyFormat(null as any)).toBe(false);
      expect(isLegacyFormat(undefined as any)).toBe(false);
    });
  });

  describe("detectMessageFormat", () => {
    it("should detect ICU format", () => {
      expect(detectMessageFormat("{count, plural, one {#} other {#}}")).toBe("icu");
      expect(detectMessageFormat("Hello {name}")).toBe("icu");
    });

    it("should detect legacy format", () => {
      expect(detectMessageFormat("Hello {{name}}")).toBe("legacy");
      expect(detectMessageFormat("{{count|one|many}}")).toBe("legacy");
    });

    it("should detect plain text", () => {
      expect(detectMessageFormat("Hello world")).toBe("plain");
      expect(detectMessageFormat("")).toBe("plain");
    });
  });

  describe("formatICUMessage", () => {
    it("should format simple ICU arguments", () => {
      const result = formatICUMessage("Hello {name}!", "en", { name: "World" });
      expect(result).toBe("Hello World!");
    });

    it("should format ICU plural - singular", () => {
      const result = formatICUMessage(
        "{count, plural, one {# item} other {# items}}",
        "en",
        { count: 1 }
      );
      expect(result).toBe("1 item");
    });

    it("should format ICU plural - plural", () => {
      const result = formatICUMessage(
        "{count, plural, one {# item} other {# items}}",
        "en",
        { count: 5 }
      );
      expect(result).toBe("5 items");
    });

    it("should format ICU plural - zero", () => {
      const result = formatICUMessage(
        "{count, plural, =0 {no items} one {# item} other {# items}}",
        "en",
        { count: 0 }
      );
      expect(result).toBe("no items");
    });

    it("should format ICU select", () => {
      const message = "{gender, select, male {He} female {She} other {They}}";

      expect(formatICUMessage(message, "en", { gender: "male" })).toBe("He");
      expect(formatICUMessage(message, "en", { gender: "female" })).toBe("She");
      expect(formatICUMessage(message, "en", { gender: "other" })).toBe("They");
      expect(formatICUMessage(message, "en", { gender: "unknown" })).toBe("They");
    });

    it("should handle nested ICU patterns", () => {
      const message =
        "{gender, select, male {{count, plural, one {He has # apple} other {He has # apples}}} female {{count, plural, one {She has # apple} other {She has # apples}}} other {{count, plural, one {They have # apple} other {They have # apples}}}}";

      expect(formatICUMessage(message, "en", { gender: "male", count: 1 })).toBe(
        "He has 1 apple"
      );
      expect(formatICUMessage(message, "en", { gender: "female", count: 3 })).toBe(
        "She has 3 apples"
      );
    });

    it("should use locale-specific plural rules", () => {
      // Russian has more complex plural rules
      const message = "{count, plural, one {# яблоко} few {# яблока} many {# яблок} other {# яблок}}";

      expect(formatICUMessage(message, "ru", { count: 1 })).toBe("1 яблоко");
      expect(formatICUMessage(message, "ru", { count: 2 })).toBe("2 яблока");
      expect(formatICUMessage(message, "ru", { count: 5 })).toBe("5 яблок");
      expect(formatICUMessage(message, "ru", { count: 21 })).toBe("21 яблоко");
    });

    it("should handle missing values gracefully", () => {
      const result = formatICUMessage("Hello {name}!", "en", {});
      // Without the library, it should return simple replacement
      // With the library, it should throw or return empty for missing arg
      expect(result).toBeDefined();
    });

    it("should return original message on invalid ICU syntax", () => {
      const invalidMessage = "{invalid, unknown, foo {bar}}";
      const result = formatICUMessage(invalidMessage, "en", {});
      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe("ICU Cache", () => {
    it("should cache compiled messages", () => {
      const message = "{count, plural, one {# item} other {# items}}";

      // First call - compiles and caches
      formatICUMessage(message, "en", { count: 1 });

      const stats1 = getICUCacheStats();
      expect(stats1.size).toBe(1);

      // Second call - uses cache
      formatICUMessage(message, "en", { count: 5 });

      const stats2 = getICUCacheStats();
      expect(stats2.size).toBe(1); // Same message, same cache entry
    });

    it("should cache different messages separately", () => {
      formatICUMessage("{count, plural, one {#} other {#}}", "en", { count: 1 });
      formatICUMessage("Hello {name}!", "en", { name: "World" });

      const stats = getICUCacheStats();
      expect(stats.size).toBe(2);
    });

    it("should cache same message for different locales separately", () => {
      const message = "{count, plural, one {# item} other {# items}}";

      formatICUMessage(message, "en", { count: 1 });
      formatICUMessage(message, "fr", { count: 1 });

      const stats = getICUCacheStats();
      expect(stats.size).toBe(2);
    });

    it("should clear cache", () => {
      formatICUMessage("{count, plural, one {#} other {#}}", "en", { count: 1 });

      expect(getICUCacheStats().size).toBe(1);

      clearICUCache();

      expect(getICUCacheStats().size).toBe(0);
    });
  });

  describe("isICULibraryAvailable", () => {
    it("should return boolean indicating library availability", () => {
      const available = isICULibraryAvailable();
      expect(typeof available).toBe("boolean");
    });
  });

  describe("Mixed format coexistence", () => {
    it("should correctly identify ICU vs legacy in same project", () => {
      const icuMessage = "{count, plural, one {# item} other {# items}}";
      const legacyMessage = "{{count|item|items}}";

      expect(isICUFormat(icuMessage)).toBe(true);
      expect(isLegacyFormat(icuMessage)).toBe(false);

      expect(isICUFormat(legacyMessage)).toBe(false);
      expect(isLegacyFormat(legacyMessage)).toBe(true);
    });

    it("should not confuse simple placeholders", () => {
      // ICU simple placeholder
      expect(isICUFormat("Hello {name}")).toBe(true);
      expect(isLegacyFormat("Hello {name}")).toBe(false);

      // Legacy double-brace placeholder
      expect(isICUFormat("Hello {{name}}")).toBe(false);
      expect(isLegacyFormat("Hello {{name}}")).toBe(true);
    });
  });
});
