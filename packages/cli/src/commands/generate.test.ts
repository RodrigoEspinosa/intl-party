import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateCommand } from "./generate";
import fs from "fs-extra";
import path from "node:path";
import { loadConfig } from "../utils/config";
import type { CLIConfig } from "../utils/config";
import { loadTranslations } from "../utils/translations";

vi.mock("fs-extra", () => ({
  pathExists: vi.fn(() => Promise.resolve(false)),
  readdir: vi.fn(() => Promise.resolve([])),
  readFile: vi.fn(() => Promise.resolve("")),
  writeFile: vi.fn(() => Promise.resolve()),
  ensureDir: vi.fn(() => Promise.resolve()),
  stat: vi.fn(() => Promise.resolve({ isDirectory: () => true })),
  readJson: vi.fn(() => Promise.resolve({})),
}));

vi.mock("node:path", () => ({
  join: vi.fn((...args) => args.join("/")),
  basename: vi.fn((path, ext) => path.split("/").pop().replace(ext, "")),
  dirname: vi.fn((p) => p.split("/").slice(0, -1).join("/")),
}));

vi.mock("../utils/config", () => ({
  loadConfig: vi.fn(),
}));

vi.mock("../utils/translations", () => ({
  loadTranslations: vi.fn(),
}));

vi.mock("ora", () => {
  const ora = vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
  }));
  return { default: ora };
});

vi.mock("chokidar", () => ({
  watch: vi.fn(() => ({
    on: vi.fn(),
  })),
}));

const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
const processExit = vi.spyOn(process, "exit").mockImplementation((code) => {
  throw new Error(`Process exit with code ${code}`);
});

describe("generateCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should generate type definitions for translations", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      namespaces: ["common"],
      sourcePatterns: ["src/**/*.ts"],
      outputDir: "./dist",
      translationPaths: {
        en: { common: "messages/en/common.json" },
        fr: { common: "messages/fr/common.json" },
      },
    };

    const mockMessages = {
      en: {
        common: {
          welcome: "Welcome",
          description: "A description",
          nested: {
            key: "A nested key",
          },
        },
      },
      fr: {
        common: {
          welcome: "Bienvenue",
          description: "Une description",
          nested: {
            key: "Une clé imbriquée",
          },
        },
      },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockMessages);
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(false));
    vi.mocked(fs.ensureDir).mockImplementation(() => Promise.resolve());
    vi.mocked(fs.writeFile).mockImplementation(() => Promise.resolve());

    await generateCommand({ types: true });

    expect(loadConfig).toHaveBeenCalled();
    expect(loadTranslations).toHaveBeenCalledWith(
      mockConfig.translationPaths,
      mockConfig.locales,
      mockConfig.namespaces,
    );

    expect(fs.ensureDir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledTimes(3);

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("translations.generated.ts"),
      expect.stringContaining("export type TranslationKey"),
    );

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("messages.generated.js"),
      expect.stringContaining("export const defaultMessages"),
    );

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Generated translation files"),
    );
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(loadConfig).mockRejectedValue(new Error("Config error"));

    await expect(generateCommand({})).rejects.toThrow(
      "Process exit with code 1",
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.anything(),
      "Config error",
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("should generate client package files when requested", async () => {
    const mockConfig: CLIConfig = {
      locales: ["en"],
      defaultLocale: "en",
      namespaces: ["common"],
      sourcePatterns: ["src/**/*.ts"],
      outputDir: "./dist",
      translationPaths: {
        en: { common: "messages/en/common.json" },
      },
    };

    const mockMessages = {
      en: {
        common: {
          welcome: "Welcome",
        },
      },
    };

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
    vi.mocked(loadTranslations).mockResolvedValue(mockMessages);
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(true));
    vi.mocked(fs.readJson).mockImplementation(() =>
      Promise.resolve({ name: "@intl-party/monorepo" }),
    );
    vi.mocked(fs.ensureDir).mockImplementation(() => Promise.resolve());
    vi.mocked(fs.writeFile).mockImplementation(() => Promise.resolve());

    await generateCommand({ types: true, client: true });

    expect(fs.ensureDir).toHaveBeenCalledWith(
      expect.stringContaining("packages/client/generated"),
    );

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("index.generated.ts"),
      expect.stringContaining("export * from './translations.generated'"),
    );

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Generating client package files"),
    );
  });
});
