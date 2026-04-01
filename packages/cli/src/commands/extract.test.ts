import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractCommand, extractKeysFromContent } from "./extract";
import fs from "fs-extra";
import path from "node:path";
import { glob } from "glob";
import { loadConfig } from "../utils/config";
import type { CLIConfig } from "../utils/config";

vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn().mockImplementation(() => Promise.resolve(false)),
    ensureDir: vi.fn().mockImplementation(() => Promise.resolve()),
    readFile: vi.fn().mockImplementation(() => Promise.resolve("")),
    readJson: vi.fn().mockImplementation(() => Promise.resolve({})),
    writeJson: vi.fn().mockImplementation(() => Promise.resolve()),
    writeFile: vi.fn().mockImplementation(() => Promise.resolve()),
  },
  pathExists: vi.fn().mockImplementation(() => Promise.resolve(false)),
  ensureDir: vi.fn().mockImplementation(() => Promise.resolve()),
  readFile: vi.fn().mockImplementation(() => Promise.resolve("")),
  readJson: vi.fn().mockImplementation(() => Promise.resolve({})),
  writeJson: vi.fn().mockImplementation(() => Promise.resolve()),
  writeFile: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock("node:path", () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join("/")),
    dirname: vi.fn((p: string) => p.split("/").slice(0, -1).join("/")),
  },
  join: vi.fn((...args: string[]) => args.join("/")),
  dirname: vi.fn((p: string) => p.split("/").slice(0, -1).join("/")),
}));

vi.mock("glob", () => ({
  glob: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../utils/config", () => ({
  loadConfig: vi.fn(() =>
    Promise.resolve({
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./messages",
      translationPaths: {
        en: { common: "messages/en/common.json" },
        fr: { common: "messages/fr/common.json" },
      },
    }),
  ),
}));

vi.mock("ora", () => {
  const ora = vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  }));
  return { default: ora };
});

const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
const processExit = vi.spyOn(process, "exit").mockImplementation((code) => {
  throw new Error(`Process exit with code ${code}`);
});

describe("extractKeysFromContent", () => {
  it("should extract t() calls with single quotes", () => {
    const content = `const x = t('hello');`;
    expect(extractKeysFromContent(content)).toContain("hello");
  });

  it("should extract t() calls with double quotes", () => {
    const content = `const x = t("hello");`;
    expect(extractKeysFromContent(content)).toContain("hello");
  });

  it("should extract t() calls with backticks", () => {
    const content = "const x = t(`hello`);";
    expect(extractKeysFromContent(content)).toContain("hello");
  });

  it("should extract useTranslations()() pattern", () => {
    const content = `const msg = useTranslations()('greeting');`;
    expect(extractKeysFromContent(content)).toContain("greeting");
  });

  it("should extract namespaced useTranslations('ns')('key') pattern", () => {
    const content = `const msg = useTranslations('common')('button.submit');`;
    expect(extractKeysFromContent(content)).toContain("common.button.submit");
  });

  it("should extract i18nKey attribute", () => {
    const content = `<Trans i18nKey="page.title" />`;
    expect(extractKeysFromContent(content)).toContain("page.title");
  });

  it("should extract JSX expression t() calls", () => {
    const content = `<p>{ t('description') }</p>`;
    expect(extractKeysFromContent(content)).toContain("description");
  });

  it("should extract multiple keys from complex content", () => {
    const content = `
      function Component() {
        return (
          <div>
            <h1>{t('welcome')}</h1>
            <p>{t('description')}</p>
            <Trans i18nKey="footer.copyright" />
          </div>
        );
      }
    `;
    const keys = extractKeysFromContent(content);
    expect(keys).toContain("welcome");
    expect(keys).toContain("description");
    expect(keys).toContain("footer.copyright");
  });

  it("should return empty array for content with no translation keys", () => {
    const content = `const x = 5; console.log(x);`;
    expect(extractKeysFromContent(content)).toEqual([]);
  });
});

describe("extractCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should extract translation keys from source files", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./messages",
      translationPaths: {
        en: { common: "messages/en/common.json" },
        fr: { common: "messages/fr/common.json" },
      },
    };

    const mockSourceFiles = [
      "src/components/Header.tsx",
      "src/pages/Home.tsx",
      "src/App.tsx",
    ];

    const mockSourceContent = `
      import React from 'react';

      function Component() {
        return (
          <div>
            <h1>{t('welcome')}</h1>
            <p>{t('description')}</p>
            <p>{useTranslations()('greeting')}</p>
            <p>{useTranslations('common')('button.submit')}</p>
            <button i18nKey="button.cancel">Cancel</button>
          </div>
        );
      }
    `;

    vi.mocked(loadConfig).mockImplementation(() => Promise.resolve(mockConfig));
    vi.mocked(glob).mockImplementation(() => Promise.resolve(mockSourceFiles));
    vi.mocked(fs.readFile).mockImplementation(() =>
      Promise.resolve(mockSourceContent),
    );
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(false));

    await extractCommand({});

    expect(loadConfig).toHaveBeenCalled();
    expect(glob).toHaveBeenCalledWith(mockConfig.sourcePatterns);
    expect(fs.readFile).toHaveBeenCalledTimes(mockSourceFiles.length);

    expect(fs.ensureDir).toHaveBeenCalledWith(
      expect.stringContaining("messages/en"),
    );
    expect(fs.ensureDir).toHaveBeenCalledWith(
      expect.stringContaining("messages/fr"),
    );

    // Check that writeJson was called for English common translations
    expect(fs.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("common.json"),
      expect.objectContaining({
        welcome: "welcome",
        description: "description",
        greeting: "greeting",
      }),
      { spaces: 2 },
    );

    // Check that writeJson was called for French common translations (empty values)
    expect(fs.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("fr/common.json"),
      expect.objectContaining({
        welcome: "",
        description: "",
        greeting: "",
      }),
      { spaces: 2 },
    );
  });

  it("should run in dry-run mode without writing files", async () => {
    const mockSourceFiles = ["src/App.tsx"];

    const mockSourceContent = `
      function App() {
        return <div>{t('app.title')}</div>;
      }
    `;

    vi.mocked(glob).mockImplementation(() => Promise.resolve(mockSourceFiles));
    vi.mocked(fs.readFile).mockImplementation(() =>
      Promise.resolve(mockSourceContent),
    );

    await extractCommand({ dryRun: true });

    expect(glob).toHaveBeenCalled();
    expect(fs.readFile).toHaveBeenCalled();

    expect(fs.writeJson).not.toHaveBeenCalled();

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Extracted keys"),
    );
  });

  it("should update existing translation files when update option is true", async () => {
    const mockSourceFiles = ["src/App.tsx"];

    const mockSourceContent = `
      function App() {
        return <div>{t('app.title')}</div>;
      }
    `;

    const existingTranslations = {
      app: {
        title: "Existing Title",
        description: "Existing Description",
      },
    };

    vi.mocked(glob).mockImplementation(() => Promise.resolve(mockSourceFiles));
    vi.mocked(fs.readFile).mockImplementation(() =>
      Promise.resolve(mockSourceContent),
    );
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(true));
    vi.mocked(fs.readJson).mockImplementation(() =>
      Promise.resolve(existingTranslations),
    );

    await extractCommand({ update: true });

    expect(fs.pathExists).toHaveBeenCalled();
    expect(fs.readJson).toHaveBeenCalled();

    expect(fs.writeJson).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        app: {
          title: "Existing Title",
          description: "Existing Description",
        },
      }),
      { spaces: 2 },
    );
  });

  it("should handle errors in config loading", async () => {
    vi.mocked(loadConfig).mockImplementation(() =>
      Promise.reject(new Error("Config not found")),
    );

    await expect(extractCommand({})).rejects.toThrow(
      "Process exit with code 1",
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.anything(),
      "Config not found",
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("should handle errors during extraction", async () => {
    vi.mocked(loadConfig).mockImplementation(() =>
      Promise.resolve({} as CLIConfig),
    );
    vi.mocked(glob).mockImplementation(() =>
      Promise.reject(new Error("File not found")),
    );

    await expect(extractCommand({})).rejects.toThrow(
      "Process exit with code 1",
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.anything(),
      "File not found",
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("should output JSON format when --format json is specified", async () => {
    const mockSourceFiles = ["src/App.tsx"];
    const mockSourceContent = `const x = t('hello');`;

    vi.mocked(glob).mockImplementation(() => Promise.resolve(mockSourceFiles));
    vi.mocked(fs.readFile).mockImplementation(() =>
      Promise.resolve(mockSourceContent),
    );
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(false));

    await extractCommand({ dryRun: true, format: "json" });

    // Should have logged a JSON string
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
    expect(parsed).toHaveProperty("extractedKeys");
    expect(parsed).toHaveProperty("missingKeysByLocale");
    expect(parsed).toHaveProperty("totalFiles");
    expect(parsed).toHaveProperty("totalKeys");
    expect(parsed.extractedKeys).toContain("hello");
  });

  it("should output JUnit XML format when --format junit is specified", async () => {
    const mockSourceFiles = ["src/App.tsx"];
    const mockSourceContent = `const x = t('hello');`;

    vi.mocked(glob).mockImplementation(() => Promise.resolve(mockSourceFiles));
    vi.mocked(fs.readFile).mockImplementation(() =>
      Promise.resolve(mockSourceContent),
    );
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(false));

    await extractCommand({ dryRun: true, format: "junit" });

    const xmlCall = consoleLog.mock.calls.find((call) =>
      String(call[0]).includes("<?xml"),
    );
    expect(xmlCall).toBeDefined();
    expect(xmlCall![0]).toContain("intl-party-extract");
    expect(xmlCall![0]).toContain("testsuites");
  });

  it("should report missing keys per locale in text format", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      sourcePatterns: ["src/**/*.{ts,tsx}"],
      outputDir: "./messages",
      translationPaths: {
        en: { common: "messages/en/common.json" },
        fr: { common: "messages/fr/common.json" },
      },
    };

    const mockSourceFiles = ["src/App.tsx"];
    const mockSourceContent = `const x = t('hello'); const y = t('world');`;

    vi.mocked(loadConfig).mockImplementation(() => Promise.resolve(mockConfig));
    vi.mocked(glob).mockImplementation(() => Promise.resolve(mockSourceFiles));
    vi.mocked(fs.readFile).mockImplementation(() =>
      Promise.resolve(mockSourceContent),
    );
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(false));

    await extractCommand({ dryRun: true });

    // Should report missing keys
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Missing keys by locale"),
    );
  });

  it("should handle empty source files gracefully", async () => {
    vi.mocked(glob).mockImplementation(() => Promise.resolve([]));

    await extractCommand({ dryRun: true });

    // Should still succeed with 0 keys
    expect(processExit).not.toHaveBeenCalled();
  });

  it("should use custom source patterns from options", async () => {
    const customPatterns = ["lib/**/*.ts"];

    vi.mocked(glob).mockImplementation(() => Promise.resolve([]));

    await extractCommand({ source: customPatterns, dryRun: true });

    expect(glob).toHaveBeenCalledWith(customPatterns);
  });
});
