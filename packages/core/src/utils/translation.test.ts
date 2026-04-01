import { describe, it, expect } from "vitest";
import {
  TranslationStore,
  flattenTranslations,
  unflattenTranslations,
  splitEscapedDots,
} from "./translation";

describe("splitEscapedDots", () => {
  it("should split on unescaped dots", () => {
    expect(splitEscapedDots("a.b.c")).toEqual(["a", "b", "c"]);
  });

  it("should not split on escaped dots", () => {
    expect(splitEscapedDots("a\\.b")).toEqual(["a.b"]);
  });

  it("should handle mixed escaped and unescaped dots", () => {
    expect(splitEscapedDots("a\\.b.c")).toEqual(["a.b", "c"]);
  });

  it("should handle multiple escaped dots", () => {
    expect(splitEscapedDots("a\\.b\\.c")).toEqual(["a.b.c"]);
  });

  it("should handle escaped dot at the end", () => {
    expect(splitEscapedDots("a\\.")).toEqual(["a."]);
  });

  it("should handle no dots", () => {
    expect(splitEscapedDots("hello")).toEqual(["hello"]);
  });

  it("should handle empty string", () => {
    expect(splitEscapedDots("")).toEqual([""]);
  });

  it("should handle multiple segments with escaped dots in the middle", () => {
    expect(splitEscapedDots("a.b\\.c.d")).toEqual(["a", "b.c", "d"]);
  });
});

describe("TranslationStore - dot-escaped keys", () => {
  it("should access flat keys with escaped dots", () => {
    const store = new TranslationStore();
    store.addTranslations("en", "common", {
      "a.b": "flat value",
    });

    expect(store.getTranslation("a\\.b", "en", "common")).toBe("flat value");
  });

  it("should still traverse nested keys with unescaped dots", () => {
    const store = new TranslationStore();
    store.addTranslations("en", "common", {
      a: {
        b: "nested value",
      },
    });

    expect(store.getTranslation("a.b", "en", "common")).toBe("nested value");
  });

  it("should distinguish between flat and nested keys", () => {
    const store = new TranslationStore();
    store.addTranslations("en", "common", {
      "a.b": "flat value",
      a: {
        b: "nested value",
      },
    });

    expect(store.getTranslation("a\\.b", "en", "common")).toBe("flat value");
    expect(store.getTranslation("a.b", "en", "common")).toBe("nested value");
  });

  it("should handle multiple escaped dots in a key", () => {
    const store = new TranslationStore();
    store.addTranslations("en", "common", {
      "x.y.z": "triple dot",
    });

    expect(store.getTranslation("x\\.y\\.z", "en", "common")).toBe(
      "triple dot",
    );
  });

  it("should handle mixed escaped and unescaped dots", () => {
    const store = new TranslationStore();
    store.addTranslations("en", "common", {
      nav: {
        "home.page": "Home Page",
      },
    });

    expect(store.getTranslation("nav.home\\.page", "en", "common")).toBe(
      "Home Page",
    );
  });

  it("should return missing key format for non-existent escaped key", () => {
    const store = new TranslationStore();
    store.addTranslations("en", "common", {
      a: { b: "nested" },
    });

    expect(store.getTranslation("a\\.b", "en", "common")).toBe(
      "[common:a\\.b]",
    );
  });

  it("should work with hasTranslation for escaped dot keys", () => {
    const store = new TranslationStore();
    store.addTranslations("en", "common", {
      "a.b": "flat value",
    });

    expect(store.hasTranslation("a\\.b", "en", "common")).toBe(true);
    expect(store.hasTranslation("a.b", "en", "common")).toBe(false);
  });

  it("should work with fallback chain and escaped dots", () => {
    const store = new TranslationStore({ fallbackChain: { es: "en" } });
    store.addTranslations("en", "common", {
      "config.key": "Config Key",
    });

    expect(store.getTranslation("config\\.key", "es", "common")).toBe(
      "Config Key",
    );
  });
});

describe("flattenTranslations - dot escaping", () => {
  it("should escape dots in keys that contain literal dots", () => {
    const nested = {
      "a.b": "value",
    };
    const flat = flattenTranslations(nested);
    expect(flat).toEqual({ "a\\.b": "value" });
  });

  it("should not escape keys without dots", () => {
    const nested = {
      simple: "value",
    };
    const flat = flattenTranslations(nested);
    expect(flat).toEqual({ simple: "value" });
  });

  it("should handle nested objects with dotted keys", () => {
    const nested = {
      nav: {
        "home.page": "Home Page",
      },
    };
    const flat = flattenTranslations(nested);
    expect(flat).toEqual({ "nav.home\\.page": "Home Page" });
  });

  it("should handle multiple levels of nesting with dotted keys", () => {
    const nested = {
      a: {
        b: {
          "c.d": "deep value",
        },
      },
    };
    const flat = flattenTranslations(nested);
    expect(flat).toEqual({ "a.b.c\\.d": "deep value" });
  });
});

describe("unflattenTranslations - dot escaping", () => {
  it("should unflatten escaped dots into flat keys", () => {
    const flat = { "a\\.b": "value" };
    const nested = unflattenTranslations(flat);
    expect(nested).toEqual({ "a.b": "value" });
  });

  it("should unflatten unescaped dots into nested objects", () => {
    const flat = { "a.b": "value" };
    const nested = unflattenTranslations(flat);
    expect(nested).toEqual({ a: { b: "value" } });
  });

  it("should handle mixed escaped and unescaped dots", () => {
    const flat = { "nav.home\\.page": "Home Page" };
    const nested = unflattenTranslations(flat);
    expect(nested).toEqual({ nav: { "home.page": "Home Page" } });
  });

  it("should roundtrip with flattenTranslations", () => {
    const original = {
      simple: "value1",
      nested: {
        key: "value2",
      },
      "dotted.key": "value3",
      parent: {
        "child.key": "value4",
      },
    };

    const flat = flattenTranslations(original);
    const restored = unflattenTranslations(flat);
    expect(restored).toEqual(original);
  });
});
