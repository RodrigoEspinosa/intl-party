import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { syncCommand, analyzeTranslations } from "./sync";
import type { SyncOptions } from "./sync";
import type { CLIConfig } from "../utils/config";
import type { AllTranslations } from "@intl-party/core";

// Mock dependencies
vi.mock("ora", () => {
  const ora = vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: "",
  }));
  return { default: ora };
});

vi.mock("../utils/config", () => ({
  loadConfig: vi.fn(),
}));

vi.mock("../utils/translations", () => ({
  loadTranslations: vi.fn(),
  saveTranslations: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock("fs-extra", () => ({
  default: {
    writeFile: vi.fn().mockImplementation(() => Promise.resolve()),
  },
  writeFile: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// Import mocked modules
import { loadConfig } from "../utils/config";
import { loadTranslations, saveTranslations } from "../utils/translations";
import inquirer from "inquirer";
import fs from "fs-extra";

// Mock console and process
const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
const processExit = vi.spyOn(process, "exit").mockImplementation((code) => {
  throw new Error(`Process exit with code ${code}`);
});

describe("analyzeTranslations", () => {
  it("should detect missing keys in target locales", () => {
    const translations: AllTranslations = {
      en: { common: { welcome: "Welcome", goodbye: "Goodbye" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    const analysis = analyzeTranslations(translations, "en", ["fr"], ["common"]);

    expect(analysis.missingCount).toBe(1);
    expect(analysis.missingKeys).toEqual([
      { locale: "fr", namespace: "common", key: "goodbye" },
    ]);
  });

  it("should detect extra/unused keys in target locales", () => {
    const translations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: { welcome: "Bienvenue", obsolete: "Obsolete" } },
    };

    const analysis = analyzeTranslations(translations, "en", ["fr"], ["common"]);

    expect(analysis.unusedCount).toBe(1);
    expect(analysis.unusedKeys).toEqual([
      { locale: "fr", namespace: "common", key: "obsolete" },
    ]);
  });

  it("should report no issues when locales are in sync", () => {
    const translations: AllTranslations = {
      en: { common: { welcome: "Welcome", goodbye: "Goodbye" } },
      fr: { common: { welcome: "Bienvenue", goodbye: "Au revoir" } },
    };

    const analysis = analyzeTranslations(translations, "en", ["fr"], ["common"]);

    expect(analysis.missingCount).toBe(0);
    expect(analysis.unusedCount).toBe(0);
    expect(analysis.totalKeys).toBe(2);
  });

  it("should handle multiple target locales", () => {
    const translations: AllTranslations = {
      en: { common: { welcome: "Welcome", goodbye: "Goodbye" } },
      fr: { common: { welcome: "Bienvenue" } },
      de: { common: { welcome: "Willkommen" } },
    };

    const analysis = analyzeTranslations(
      translations,
      "en",
      ["fr", "de"],
      ["common"]
    );

    expect(analysis.missingCount).toBe(2); // goodbye missing in both fr and de
    expect(analysis.missingKeys).toHaveLength(2);
  });

  it("should handle multiple namespaces", () => {
    const translations: AllTranslations = {
      en: {
        common: { welcome: "Welcome" },
        errors: { notFound: "Not Found" },
      },
      fr: {
        common: { welcome: "Bienvenue" },
        errors: {},
      },
    };

    const analysis = analyzeTranslations(
      translations,
      "en",
      ["fr"],
      ["common", "errors"]
    );

    expect(analysis.missingCount).toBe(1);
    expect(analysis.missingKeys[0]).toEqual({
      locale: "fr",
      namespace: "errors",
      key: "notFound",
    });
  });

  it("should handle nested translation keys", () => {
    const translations: AllTranslations = {
      en: { common: { buttons: { submit: "Submit", cancel: "Cancel" } } },
      fr: { common: { buttons: { submit: "Soumettre" } } },
    };

    const analysis = analyzeTranslations(translations, "en", ["fr"], ["common"]);

    expect(analysis.missingCount).toBe(1);
    expect(analysis.missingKeys[0].key).toBe("buttons.cancel");
  });

  it("should handle empty translation objects", () => {
    const translations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: {} },
    };

    const analysis = analyzeTranslations(translations, "en", ["fr"], ["common"]);

    expect(analysis.missingCount).toBe(1);
    expect(analysis.unusedCount).toBe(0);
  });

  it("should handle missing namespace in target locale", () => {
    const translations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: {},
    };

    const analysis = analyzeTranslations(translations, "en", ["fr"], ["common"]);

    expect(analysis.missingCount).toBe(1);
  });
});

describe("syncCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should sync translations and save updated files", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome", goodbye: "Goodbye" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await syncCommand({});

    expect(loadConfig).toHaveBeenCalled();
    expect(loadTranslations).toHaveBeenCalledWith(
      mockConfig.translationPaths,
      mockConfig.locales,
      mockConfig.namespaces
    );
    expect(saveTranslations).toHaveBeenCalled();

    // Verify the saved translations include the missing key
    const savedCall = vi.mocked(saveTranslations).mock.calls[0];
    const savedTranslations = savedCall[0] as AllTranslations;
    expect(savedTranslations.fr.common).toHaveProperty("goodbye");
  });

  it("should not save when --dry-run is specified", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome", goodbye: "Goodbye" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await syncCommand({ dryRun: true });

    expect(saveTranslations).not.toHaveBeenCalled();
  });

  it("should respect --base-locale option", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr", "de"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
        de: { common: "locales/de/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { hello: "Hello" } },
      fr: { common: { hello: "Bonjour", merci: "Merci" } },
      de: { common: {} },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    // Use fr as base locale
    await syncCommand({ base: "fr" });

    expect(saveTranslations).toHaveBeenCalled();

    const savedCall = vi.mocked(saveTranslations).mock.calls[0];
    const savedTranslations = savedCall[0] as AllTranslations;

    // en and de should get "merci" from fr base
    expect(savedTranslations.en.common).toHaveProperty("merci");
    expect(savedTranslations.de.common).toHaveProperty("hello");
    expect(savedTranslations.de.common).toHaveProperty("merci");
  });

  it("should respect --target-locales option", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr", "de"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
        de: { common: "locales/de/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: {} },
      de: { common: {} },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    // Only sync to fr, not de
    await syncCommand({ target: ["fr"] });

    expect(saveTranslations).toHaveBeenCalled();
    const savedCall = vi.mocked(saveTranslations).mock.calls[0];
    const savedTranslations = savedCall[0] as AllTranslations;

    expect(savedTranslations.fr.common).toHaveProperty("welcome");
    // de should remain empty since it wasn't targeted
    expect(savedTranslations.de.common).not.toHaveProperty("welcome");
  });

  it("should only add missing keys when --missing-only is specified", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: { welcome: "Bienvenue", obsolete: "Obsolete" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await syncCommand({ missingOnly: true });

    expect(saveTranslations).toHaveBeenCalled();
    const savedCall = vi.mocked(saveTranslations).mock.calls[0];
    const savedTranslations = savedCall[0] as AllTranslations;

    // obsolete should NOT be removed in missing-only mode
    expect(savedTranslations.fr.common).toHaveProperty("obsolete");
  });

  it("should remove unused keys when --missing-only is not set", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: { welcome: "Bienvenue", obsolete: "Obsolete" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await syncCommand({});

    expect(saveTranslations).toHaveBeenCalled();
    const savedCall = vi.mocked(saveTranslations).mock.calls[0];
    const savedTranslations = savedCall[0] as AllTranslations;

    // obsolete should be removed
    expect(savedTranslations.fr.common).not.toHaveProperty("obsolete");
  });

  it("should output JSON format when --format json is specified", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await syncCommand({ format: "json", dryRun: true });

    const jsonCall = consoleLog.mock.calls.find((call) => {
      try {
        JSON.parse(call[0]);
        return true;
      } catch {
        return false;
      }
    });
    expect(jsonCall).toBeDefined();

    const parsed = JSON.parse(jsonCall![0]);
    expect(parsed).toHaveProperty("missingKeys");
    expect(parsed).toHaveProperty("unusedKeys");
    expect(parsed).toHaveProperty("totalKeys");
    expect(parsed).toHaveProperty("missingCount");
    expect(parsed).toHaveProperty("unusedCount");
  });

  it("should output JUnit XML format when --format junit is specified", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome", goodbye: "Goodbye" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await syncCommand({ format: "junit", dryRun: true });

    const xmlCall = consoleLog.mock.calls.find((call) =>
      String(call[0]).includes("<?xml"),
    );
    expect(xmlCall).toBeDefined();
    expect(xmlCall![0]).toContain("intl-party-sync");
    expect(xmlCall![0]).toContain("testsuites");
    expect(xmlCall![0]).toContain("failure");
  });

  it("should write JSON to file when --output is specified", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await syncCommand({ format: "json", output: "report.json", dryRun: true });

    expect(fs.writeFile).toHaveBeenCalledWith(
      "report.json",
      expect.any(String),
    );
  });

  it("should handle config loading errors", async () => {
    vi.mocked(loadConfig).mockRejectedValue(
      new Error("Config file not found"),
    );

    await expect(syncCommand({})).rejects.toThrow("Process exit with code 1");

    expect(consoleError).toHaveBeenCalledWith(
      expect.anything(),
      "Config file not found",
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("should error when base locale is not in config", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: {} },
      fr: { common: {} },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await expect(syncCommand({ base: "ja" })).rejects.toThrow(
      "Process exit with code 1",
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("Base locale 'ja' not found"),
    );
  });

  it("should handle interactive mode cancellation", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome", goodbye: "Goodbye" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);
    vi.mocked(inquirer.prompt).mockResolvedValue({
      addMissing: false,
      removeUnused: false,
    });

    await syncCommand({ interactive: true });

    expect(inquirer.prompt).toHaveBeenCalled();
    expect(saveTranslations).not.toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("cancelled"),
    );
  });

  it("should handle translations that are already in sync", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      translationPaths: {
        en: { common: "locales/en/common.json" },
        fr: { common: "locales/fr/common.json" },
      },
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./translations",
    };

    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    await syncCommand({});

    expect(saveTranslations).toHaveBeenCalled();

    // Should display sync complete with 0 missing, 0 unused
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Sync Complete"),
    );
  });
});
