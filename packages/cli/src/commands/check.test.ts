import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkCommand } from "./check";
import type { CLIConfig } from "../utils/config";
import type {
  AllTranslations,
  ValidationError,
  ValidationResult,
} from "@intl-party/core";

// Mock dependencies
vi.mock("ora", () => {
  const ora = vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
  }));
  return { default: ora };
});

vi.mock("../utils/config", () => ({
  loadConfig: vi.fn(),
}));

vi.mock("../utils/translations", () => ({
  loadTranslations: vi.fn(),
}));

vi.mock("@intl-party/core", () => ({
  validateTranslations: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  pathExists: vi.fn(),
  readJson: vi.fn(),
}));

// Import the mocked modules
import { loadConfig } from "../utils/config";
import { loadTranslations } from "../utils/translations";
import { validateTranslations } from "@intl-party/core";

// Mock console methods
const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
const processExit = vi.spyOn(process, "exit").mockImplementation((code) => {
  throw new Error(`Process exit with code ${code}`);
});

describe("checkCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should load configuration and translations", async () => {
    // Mock configuration
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

    // Mock translations
    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    // Mock validation result (no errors)
    const mockValidationResult: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Set up mocks
    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);
    vi.mocked(validateTranslations).mockReturnValue(mockValidationResult);

    // Call the command
    await checkCommand({});

    // Verify the command executed correctly
    expect(loadConfig).toHaveBeenCalled();
    expect(loadTranslations).toHaveBeenCalledWith(
      mockConfig.translationPaths,
      mockConfig.locales,
      mockConfig.namespaces,
    );
    expect(validateTranslations).toHaveBeenCalledTimes(2);
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("No issues found"),
    );
    expect(processExit).not.toHaveBeenCalled();
  });

  it("should report missing translations", async () => {
    // Mock configuration
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

    // Mock translations
    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome", goodbye: "Goodbye" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    // Mock validation result with missing translation error
    const mockValidationResult: ValidationResult = {
      valid: false,
      errors: [
        {
          type: "missing_key" as const,
          locale: "fr",
          namespace: "common",
          key: "goodbye",
          message: "Missing translation for 'goodbye' in fr/common",
        },
      ],
      warnings: [],
    };

    // Set up mocks
    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);
    vi.mocked(validateTranslations).mockReturnValue(mockValidationResult);

    // Call the command and expect process.exit to be called
    await expect(checkCommand({ missing: true })).rejects.toThrow(
      "Process exit with code 1",
    );

    // Verify the command executed correctly
    expect(loadConfig).toHaveBeenCalled();
    expect(loadTranslations).toHaveBeenCalled();
    expect(validateTranslations).toHaveBeenCalledWith(
      mockTranslations,
      mockConfig.locales,
      mockConfig.namespaces,
      { strict: true },
    );
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Found 1 issue"),
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("should report format errors", async () => {
    // Mock configuration
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

    // Mock translations
    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome {{name}}" } },
      fr: { common: { welcome: "Bienvenue {name}" } }, // Invalid format
    };

    // Mock validation results
    const emptyValidationResult: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const formatErrorResult: ValidationResult = {
      valid: false,
      errors: [
        {
          type: "invalid_format" as const,
          locale: "fr",
          namespace: "common",
          key: "welcome",
          message: "Invalid interpolation format in fr/common/welcome",
        },
      ],
      warnings: [],
    };

    // Set up mocks
    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);

    // First call for missing translations returns no errors
    // Second call for format errors returns an error
    vi.mocked(validateTranslations)
      .mockReturnValueOnce(emptyValidationResult)
      .mockReturnValueOnce(formatErrorResult);

    // Call the command and expect process.exit to be called
    await expect(checkCommand({ formatErrors: true })).rejects.toThrow(
      "Process exit with code 1",
    );

    // Verify the command executed correctly
    expect(validateTranslations).toHaveBeenCalledTimes(2);
    expect(validateTranslations).toHaveBeenLastCalledWith(
      mockTranslations,
      mockConfig.locales,
      mockConfig.namespaces,
      { validateFormats: true },
    );
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Found 1 issue"),
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("should handle configuration loading errors", async () => {
    // Mock configuration loading error
    vi.mocked(loadConfig).mockRejectedValue(new Error("Config file not found"));

    // Call the command and expect it to throw
    await expect(checkCommand({})).rejects.toThrow("Process exit with code 1");

    // Verify error handling
    expect(loadConfig).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.anything(),
      "Config file not found",
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("should handle all check options", async () => {
    // Mock configuration
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

    // Mock translations
    const mockTranslations: AllTranslations = {
      en: { common: { welcome: "Welcome" } },
      fr: { common: { welcome: "Bienvenue" } },
    };

    // Mock validation result (no errors)
    const mockValidationResult: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Set up mocks
    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockTranslations);
    vi.mocked(validateTranslations).mockReturnValue(mockValidationResult);

    // Call the command with all options
    await checkCommand({
      missing: true,
      unused: true,
      duplicates: true,
      formatErrors: true,
      fix: true,
      verbose: true,
    });

    // Verify the command executed correctly
    expect(loadConfig).toHaveBeenCalled();
    expect(loadTranslations).toHaveBeenCalled();
    expect(validateTranslations).toHaveBeenCalledTimes(2);
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("No issues found"),
    );
  });
});
