import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractCommand } from "./extract";
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
  },
  pathExists: vi.fn().mockImplementation(() => Promise.resolve(false)),
  ensureDir: vi.fn().mockImplementation(() => Promise.resolve()),
  readFile: vi.fn().mockImplementation(() => Promise.resolve("")),
  readJson: vi.fn().mockImplementation(() => Promise.resolve({})),
  writeJson: vi.fn().mockImplementation(() => Promise.resolve()),
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
            <p>{useSimplifiedTranslations('common')('button.submit')}</p>
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

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Translation keys extracted"),
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
});
