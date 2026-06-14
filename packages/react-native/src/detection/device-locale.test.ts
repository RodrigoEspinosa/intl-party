import { describe, it, expect } from "vitest";
import { createDeviceLocaleDetector } from "./device-locale";

describe("createDeviceLocaleDetector", () => {
  it("returns the fallback locale when no native localization module is installed", () => {
    // Neither expo-localization nor react-native-localize is installed in the
    // test environment, so detection must degrade to the fallback rather than
    // throw.
    const detect = createDeviceLocaleDetector({
      supportedLocales: ["en", "fr"],
      fallbackLocale: "en",
    });

    expect(detect()).toBe("en");
  });
});
