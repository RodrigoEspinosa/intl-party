import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initCommand } from "./init";
import fs from "fs-extra";
import path from "node:path";
import inquirer from "inquirer";
import { saveConfig } from "../utils/config";

vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(() => Promise.resolve(false)),
    ensureDir: vi.fn(() => Promise.resolve()),
    writeJson: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
  },
  pathExists: vi.fn(() => Promise.resolve(false)),
  ensureDir: vi.fn(() => Promise.resolve()),
  writeJson: vi.fn(() => Promise.resolve()),
  writeFile: vi.fn(() => Promise.resolve()),
}));

vi.mock("node:path", () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join("/")),
  },
  join: vi.fn((...args: string[]) => args.join("/")),
}));

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock("../utils/config", () => ({
  saveConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock("ora", () => {
  const ora = vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  }));
  return { default: ora };
});

const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
const processExit = vi.spyOn(process, "exit").mockImplementation((code) => {
  throw new Error(`Process exit with code ${code}`);
});

describe("initCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize a new configuration with default values", async () => {
    const mockAnswers = {
      defaultLocale: "en",
      locales: ["en", "es", "fr"],
      namespaces: ["common"],
      translationsDir: "./translations",
      sourceDir: "./src",
    };

    vi.mocked(inquirer.prompt).mockResolvedValue(mockAnswers);
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(false));

    await initCommand({});

    expect(fs.pathExists).toHaveBeenCalledWith("intl-party.config.json");
    expect(inquirer.prompt).toHaveBeenCalled();

    expect(fs.ensureDir).toHaveBeenCalledWith(mockAnswers.translationsDir);

    for (const locale of mockAnswers.locales) {
      expect(fs.ensureDir).toHaveBeenCalledWith(
        `${mockAnswers.translationsDir}/${locale}`,
      );
    }

    for (const locale of mockAnswers.locales) {
      for (const namespace of mockAnswers.namespaces) {
        expect(fs.writeJson).toHaveBeenCalledWith(
          expect.stringContaining(
            `${mockAnswers.translationsDir}/${locale}/${namespace}.json`,
          ),
          {},
          { spaces: 2 },
        );
      }
    }

    expect(saveConfig).toHaveBeenCalled();

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Configuration created"),
      expect.anything(),
    );
  });

  it("should ask for confirmation when config already exists", async () => {
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(true));
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ overwrite: false })
      .mockResolvedValueOnce({
        defaultLocale: "en",
        locales: ["en", "fr"],
        namespaces: ["common"],
        translationsDir: "./translations",
        sourceDir: "./src",
      });

    await initCommand({});

    expect(fs.pathExists).toHaveBeenCalledWith("intl-party.config.json");
    expect(inquirer.prompt).toHaveBeenCalledTimes(1);
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({
        name: "overwrite",
        message: expect.stringContaining("already exists"),
      }),
    ]);

    expect(saveConfig).not.toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("cancelled"),
    );
  });

  it("should create template files when template option is provided", async () => {
    const mockAnswers = {
      defaultLocale: "en",
      locales: ["en", "fr"],
      namespaces: ["common"],
      translationsDir: "./translations",
      sourceDir: "./src",
    };

    vi.mocked(inquirer.prompt).mockResolvedValue(mockAnswers);
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(false));

    await initCommand({ template: "nextjs" });

    expect(fs.writeFile).toHaveBeenCalledWith(
      "middleware.ts",
      expect.stringContaining("createI18nMiddleware"),
    );

    expect(fs.ensureDir).toHaveBeenCalledWith("app/[locale]");

    expect(fs.writeFile).toHaveBeenCalledWith(
      "app/[locale]/layout.tsx",
      expect.stringContaining("AppI18nProvider"),
    );

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Template files created"),
    );
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(inquirer.prompt).mockRejectedValue(new Error("Prompt error"));

    await expect(initCommand({})).rejects.toThrow("Process exit with code 1");

    expect(consoleError).toHaveBeenCalledWith(
      expect.anything(),
      "Prompt error",
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("should skip confirmation when force option is true", async () => {
    const mockAnswers = {
      defaultLocale: "en",
      locales: ["en", "fr"],
      namespaces: ["common"],
      translationsDir: "./translations",
      sourceDir: "./src",
    };

    vi.mocked(inquirer.prompt).mockResolvedValue(mockAnswers);
    vi.mocked(fs.pathExists).mockImplementation(() => Promise.resolve(true));

    await initCommand({ force: true });

    expect(inquirer.prompt).not.toHaveBeenCalledWith([
      expect.objectContaining({
        name: "overwrite",
      }),
    ]);

    expect(saveConfig).toHaveBeenCalled();
  });
});
