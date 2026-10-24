import { describe, it, expect } from "vitest";
import picomatch from "picomatch";
import pkg from "../package.json";
import { DEFAULT_TRANSLATION_FILES } from "./defaults";

describe("DEFAULT_TRANSLATION_FILES", () => {
  const matches = picomatch(DEFAULT_TRANSLATION_FILES);

  it("finds the layout the CLI scaffolds and the common alternatives", () => {
    expect(matches("messages/en/common.json")).toBe(true);
    expect(matches("apps/web/messages/es/common.json")).toBe(true);
    expect(matches("locales/en.json")).toBe(true);
    expect(matches("src/locales/fr-FR/common.json")).toBe(true);
    expect(matches("package.json")).toBe(false);
  });

  it("matches the default declared in package.json", () => {
    expect(
      pkg.contributes.configuration.properties["intl-party.translationFiles"]
        .default,
    ).toBe(DEFAULT_TRANSLATION_FILES);
  });
});
